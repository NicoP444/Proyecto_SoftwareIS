import prisma from '../config/prisma.js';
import { NotFoundError } from '../utils/errores.js';

const suma = (r, campo) => r._sum[campo] ?? 0;

// RF-P7-09: pagos del cliente + aportes cumplidos − remuneraciones − gastos − pérdidas de inventario.
// `db` puede ser prisma o una transacción (tx). Las consultas van en serie a propósito.
export const calcularRentabilidad = async (id_evento, db = prisma) => {
  const pagos = await db.pagoCliente.aggregate({ _sum: { monto: true }, where: { id_evento } });
  const aportes = await db.cumplimientoAporte.aggregate({ _sum: { monto_recibido: true }, where: { acuerdo: { id_evento } } });
  const remuneraciones = await db.asignacionPersonal.aggregate({ _sum: { remuneracion: true }, where: { id_evento } });
  const gastos = await db.gastoEvento.aggregate({ _sum: { monto: true }, where: { asignacion: { id_evento } } });
  const perdidas = await db.incidente.aggregate({ _sum: { valor: true }, where: { id_evento } });

  const pagos_cliente = suma(pagos, 'monto');
  const aportes_auspiciadores = suma(aportes, 'monto_recibido');
  const ingresos = pagos_cliente + aportes_auspiciadores;
  const total_remuneraciones = suma(remuneraciones, 'remuneracion');
  const total_gastos = suma(gastos, 'monto');
  const perdidas_inventario = suma(perdidas, 'valor');
  const resultado = ingresos - total_remuneraciones - total_gastos - perdidas_inventario;

  return {
    pagos_cliente,
    aportes_auspiciadores,
    ingresos,
    remuneraciones: total_remuneraciones,
    gastos: total_gastos,
    perdidas_inventario,
    resultado,
    tipo: resultado < 0 ? 'PERDIDA' : 'GANANCIA',
  };
};

// Lo que ve el usuario: el cálculo al día, o el resultado fijo si la jornada ya se cerró
export const obtenerRentabilidad = async (id_evento) => {
  const evento = await prisma.evento.findUnique({ where: { id_evento } });
  if(!evento) throw new NotFoundError('El evento no existe');

  const r = await calcularRentabilidad(id_evento);
  const definitiva = evento.estado === 'CERRADO' && evento.rentabilidad_final !== null;
  const resultado = definitiva ? evento.rentabilidad_final : r.resultado;

  return {
    id_evento,
    estado_evento: evento.estado,
    definitiva,
    ...r,
    resultado,
    tipo: resultado < 0 ? 'PERDIDA' : 'GANANCIA',
  };
};

// ---------- RF-P7-12: eventos de un mes con sus ingresos, costos y resultado ----------
export const listarRentabilidadPorMes = async (anio, mes) => {
  const desde = new Date(Date.UTC(anio, mes - 1, 1));
  const hasta = new Date(Date.UTC(anio, mes, 1));

  // Solo eventos que ya se realizaron (o cerraron), en orden de fecha
  const eventos = await prisma.evento.findMany({
    where: { fecha: { gte: desde, lt: hasta }, estado: { in: ['REALIZADO', 'CERRADO'] } },
    include: { cliente: { select: { nombre: true } } },
    orderBy: [{ fecha: 'asc' }, { hora_inicio: 'asc' }],
  });

  const filas = [];
  for(const ev of eventos){
    const r = await calcularRentabilidad(ev.id_evento);
    const definitiva = ev.estado === 'CERRADO' && ev.rentabilidad_final !== null;
    const resultado = definitiva ? ev.rentabilidad_final : r.resultado;
    filas.push({
      id_evento: ev.id_evento,
      fecha: ev.fecha,
      tipo_evento: ev.tipo,
      cliente: ev.cliente.nombre,
      estado_evento: ev.estado,
      definitiva,
      ingresos: r.ingresos,
      costos: r.remuneraciones + r.gastos + r.perdidas_inventario,
      resultado,
      tipo: resultado < 0 ? 'PERDIDA' : 'GANANCIA',
    });
  }

  return {
    anio,
    mes,
    eventos: filas,
    totales: {
      eventos: filas.length,
      ingresos: filas.reduce((s, f) => s + f.ingresos, 0),
      costos: filas.reduce((s, f) => s + f.costos, 0),
      resultado: filas.reduce((s, f) => s + f.resultado, 0),
      ganancias: filas.filter((f) => f.tipo === 'GANANCIA').length,
      perdidas: filas.filter((f) => f.tipo === 'PERDIDA').length,
    },
  };
};

// ---------- RF-P7-12: detalle de movimientos de un evento ----------
export const movimientosDeEvento = async (id_evento) => {
  const evento = await prisma.evento.findUnique({ where: { id_evento } });
  if(!evento) throw new NotFoundError('El evento no existe');

  const pagos = await prisma.pagoCliente.findMany({ where: { id_evento } });
  const aportes = await prisma.cumplimientoAporte.findMany({
    where: { acuerdo: { id_evento } },
    include: { acuerdo: { select: { glosa: true, auspiciador: { select: { nombre: true } } } } },
  });
  const asignaciones = await prisma.asignacionPersonal.findMany({
    where: { id_evento, remuneracion: { not: null } },
    include: { trabajador: { select: { nombre: true } }, rol: { select: { nombre: true } } },
  });
  const gastos = await prisma.gastoEvento.findMany({
    where: { asignacion: { id_evento } },
    include: { asignacion: { include: { trabajador: { select: { nombre: true } } } } },
  });
  const incidentes = await prisma.incidente.findMany({ where: { id_evento } });

  const movimientos = [
    ...pagos.map((p) => ({
      fecha: p.fecha, tipo: 'INGRESO', concepto: 'Pago del cliente',
      detalle: `${p.tipo_pago} · ${p.medio_pago}`, monto: p.monto,
    })),
    ...aportes.map((a) => ({
      fecha: a.fecha, tipo: 'INGRESO', concepto: 'Aporte de auspiciador',
      detalle: `${a.acuerdo.auspiciador.nombre} · ${a.acuerdo.glosa}`, monto: a.monto_recibido,
    })),
    // La remuneración no tiene fecha propia: se muestra en la fecha del evento
    ...asignaciones.map((a) => ({
      fecha: evento.fecha, tipo: 'COSTO', concepto: 'Remuneración',
      detalle: `${a.trabajador.nombre} · ${a.rol.nombre}`, monto: a.remuneracion,
    })),
    ...gastos.map((g) => ({
      fecha: g.fecha, tipo: 'COSTO', concepto: 'Gasto del evento',
      detalle: `${g.tipo_gasto} · ${g.asignacion.trabajador.nombre}`, monto: g.monto,
    })),
    ...incidentes.map((i) => ({
      fecha: i.fecha, tipo: 'COSTO', concepto: 'Pérdida de inventario',
      detalle: `${i.tipo} · ${i.descripcion}`, monto: i.valor,
    })),
  ].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  return { id_evento, movimientos };
};