import prisma from '../config/prisma.js';

export const obtenerResumenFinancieroMensualService = async ({ anio, mes }) => {
  const fechaInicio = new Date(Date.UTC(anio, mes - 1, 1));
  const fechaFin = new Date(Date.UTC(anio, mes, 1));

  // Verificar si ya existe registro en mes_contable
  const mesContable = await prisma.mesContable.findUnique({
    where: {
      anio_mes: { anio, mes },
    },
    include: {
      contador: { select: { id_contador: true, nombre: true } },
    },
  });

  // Si el mes ya está CERRADO, devolvemos su resumen fijado (RF-P8-05)
  if (mesContable && mesContable.estado === 'CERRADO') {
    const ingresosClientes = Number(mesContable.total_ingresos || 0);
    const aportesAuspiciadores = Number(mesContable.total_aportes || 0);
    const remuneraciones = Number(mesContable.total_remuneraciones || 0);
    const gastosEventos = Number(mesContable.total_gastos_evento || 0);
    const gastosFijos = Number(mesContable.total_gastos_fijos || 0);
    const perdidasInventario = Number(mesContable.total_perdidas || 0);
    const totalIngresos = ingresosClientes + aportesAuspiciadores;
    const totalEgresos = remuneraciones + gastosEventos + gastosFijos + perdidasInventario;
    const utilidadNeta = Number(mesContable.utilidad_neta ?? totalIngresos - totalEgresos);

    return {
      anio,
      mes,
      estado: 'CERRADO',
      fecha_cierre: mesContable.fecha_cierre,
      cerrado_por: mesContable.contador?.nombre || null,
      ingresos_clientes: ingresosClientes,
      aportes_auspiciadores: aportesAuspiciadores,
      total_ingresos: totalIngresos,
      remuneraciones,
      gastos_eventos: gastosEventos,
      gastos_fijos: gastosFijos,
      perdidas_inventario: perdidasInventario,
      total_egresos: totalEgresos,
      utilidad_neta: utilidadNeta,
      resultado: utilidadNeta > 0 ? 'GANANCIA' : utilidadNeta < 0 ? 'PERDIDA' : 'EQUILIBRIO',
    };
  }

  // Si está ABIERTO (o aún no existe), calculamos en vivo desde las tablas del mes
  const [
    pagosClienteAgg,
    aportesAgg,
    remuneracionesAgg,
    gastosEventosAgg,
    gastosFijosAgg,
    perdidasAgg,
  ] = await Promise.all([
    prisma.pagoCliente.aggregate({
      where: { fecha: { gte: fechaInicio, lt: fechaFin } },
      _sum: { monto: true },
    }),
    prisma.cumplimientoAporte.aggregate({
      where: { fecha: { gte: fechaInicio, lt: fechaFin } },
      _sum: { monto_recibido: true },
    }),
    prisma.pagoRemuneracion.aggregate({
      where: { fecha: { gte: fechaInicio, lt: fechaFin } },
      _sum: { monto: true },
    }),
    prisma.gastoEvento.aggregate({
      where: { fecha: { gte: fechaInicio, lt: fechaFin } },
      _sum: { monto: true },
    }),
    mesContable
      ? prisma.gastoFijo.aggregate({
          where: { id_mes: mesContable.id_mes },
          _sum: { monto: true },
        })
      : Promise.resolve({ _sum: { monto: 0 } }),
    prisma.incidente.aggregate({
      where: { fecha: { gte: fechaInicio, lt: fechaFin } },
      _sum: { valor: true },
    }),
  ]);

  const ingresosClientes = Number(pagosClienteAgg._sum.monto || 0);
  const aportesAuspiciadores = Number(aportesAgg._sum.monto_recibido || 0);
  const totalIngresos = ingresosClientes + aportesAuspiciadores;

  const remuneraciones = Number(remuneracionesAgg._sum.monto || 0);
  const gastosEventos = Number(gastosEventosAgg._sum.monto || 0);
  const gastosFijos = Number(gastosFijosAgg._sum.monto || 0);
  const perdidasInventario = Number(perdidasAgg._sum.valor || 0);
  const totalEgresos = remuneraciones + gastosEventos + gastosFijos + perdidasInventario;

  const utilidadNeta = totalIngresos - totalEgresos;

  return {
    anio,
    mes,
    estado: mesContable?.estado || 'ABIERTO',
    fecha_cierre: null,
    cerrado_por: null,
    ingresos_clientes: ingresosClientes,
    aportes_auspiciadores: aportesAuspiciadores,
    total_ingresos: totalIngresos,
    remuneraciones,
    gastos_eventos: gastosEventos,
    gastos_fijos: gastosFijos,
    perdidas_inventario: perdidasInventario,
    total_egresos: totalEgresos,
    utilidad_neta: utilidadNeta,
    resultado: utilidadNeta > 0 ? 'GANANCIA' : utilidadNeta < 0 ? 'PERDIDA' : 'EQUILIBRIO',
  };
};