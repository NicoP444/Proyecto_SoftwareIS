import prisma from '../config/prisma.js';

export const obtenerResumenInventarioService = async ({ anio, mes }) => {
  const fechaInicio = new Date(Date.UTC(anio, mes - 1, 1));
  const fechaFin = new Date(Date.UTC(anio, mes, 1));

  // 1. Equipos comprados en el mes seleccionado
  const comprados = await prisma.equipo.findMany({
    where: {
      fecha_compra: {
        gte: fechaInicio,
        lt: fechaFin,
      },
    },
    orderBy: { fecha_compra: 'desc' },
  });

  // 2. Equipos dados de baja en el mes (fecha_baja) o perdidos/robados por incidente en el mes
  const bajasMes = await prisma.equipo.findMany({
    where: {
      fecha_baja: {
        gte: fechaInicio,
        lt: fechaFin,
      },
    },
    orderBy: { fecha_baja: 'desc' },
  });

  const incidentesBajaMes = await prisma.incidente.findMany({
    where: {
      fecha: {
        gte: fechaInicio,
        lt: fechaFin,
      },
      tipo: {
        in: ['PERDIDA', 'ROBO'],
      },
    },
    include: {
      equipo: true,
    },
    orderBy: { fecha: 'desc' },
  });

  // Unificar perdidos/robados/dados de baja del mes sin duplicar por código
  const mapaBajas = new Map();

  bajasMes.forEach((eq) => {
    mapaBajas.set(eq.codigo, {
      codigo: eq.codigo,
      nombre: eq.nombre,
      categoria: eq.categoria,
      motivo: eq.motivo_baja || 'Dado de baja',
      fecha: eq.fecha_baja,
      valor: Number(eq.valor_compra || 0),
    });
  });

  incidentesBajaMes.forEach((inc) => {
    if (inc.equipo && !mapaBajas.has(inc.equipo.codigo)) {
      mapaBajas.set(inc.equipo.codigo, {
        codigo: inc.equipo.codigo,
        nombre: inc.equipo.nombre,
        categoria: inc.equipo.categoria,
        motivo: inc.tipo === 'ROBO' ? 'Robo en incidente' : 'Pérdida en incidente',
        fecha: inc.fecha,
        valor: Number(inc.valor || inc.equipo.valor_compra || 0),
      });
    }
  });

  const perdidosOBajas = Array.from(mapaBajas.values());

  // 3. Equipos que se mantienen en inventario activo (no perdidos, robados ni dados de baja)
  const equiposActivos = await prisma.equipo.findMany({
    where: {
      estado: {
        in: ['OPERATIVO', 'DANADO'],
      },
      fecha_compra: {
        lt: fechaFin,
      },
    },
    include: {
      kit: { select: { nombre: true } },
    },
    orderBy: { codigo: 'asc' },
  });

  const totalCompradoMes = comprados.reduce((acc, eq) => acc + Number(eq.valor_compra || 0), 0);
  const totalPerdidoBajaMes = perdidosOBajas.reduce((acc, eq) => acc + Number(eq.valor || 0), 0);
  const valorTotalActivo = equiposActivos.reduce((acc, eq) => acc + Number(eq.valor_compra || 0), 0);

  return {
    anio,
    mes,
    comprados: comprados.map((eq) => ({
      codigo: eq.codigo,
      nombre: eq.nombre,
      categoria: eq.categoria,
      marca: eq.marca,
      modelo: eq.modelo,
      fecha_compra: eq.fecha_compra,
      valor_compra: Number(eq.valor_compra || 0),
    })),
    perdidos_o_bajas: perdidosOBajas,
    activos: equiposActivos.map((eq) => ({
      codigo: eq.codigo,
      nombre: eq.nombre,
      categoria: eq.categoria,
      estado: eq.estado,
      kit: eq.kit?.nombre || 'Repuesto en bodega',
      valor_compra: Number(eq.valor_compra || 0),
    })),
    totales: {
      cantidad_comprados: comprados.length,
      total_comprado_mes: totalCompradoMes,
      cantidad_bajas: perdidosOBajas.length,
      total_bajas_mes: totalPerdidoBajaMes,
      cantidad_activos: equiposActivos.length,
      valor_inventario_activo: valorTotalActivo,
    },
  };
};