import prisma from '../config/prisma.js';

export const obtenerPerdidasInventarioService = async ({ anio, mes }) => {
  const fechaInicio = new Date(Date.UTC(anio, mes - 1, 1));
  const fechaFin = new Date(Date.UTC(anio, mes, 1));

  const incidentes = await prisma.incidente.findMany({
    where: {
      fecha: {
        gte: fechaInicio,
        lt: fechaFin,
      },
    },
    include: {
      equipo: {
        select: { codigo: true, nombre: true, categoria: true },
      },
      evento: {
        select: { id_evento: true, tipo: true, fecha: true },
      },
      trabajador: {
        select: { id_trabajador: true, nombre: true },
      },
      jefe: {
        select: { id_jefe: true, nombre: true },
      },
    },
    orderBy: { fecha: 'desc' },
  });

  const detalle = incidentes.map((inc) => ({
    id_incidente: inc.id_incidente,
    fecha: inc.fecha,
    equipo: inc.equipo
      ? `${inc.equipo.nombre} (${inc.equipo.codigo})`
      : inc.codigo,
    tipo: inc.tipo,
    origen: inc.evento
      ? `#${inc.evento.id_evento} · ${inc.evento.tipo}`
      : 'Fuera de evento',
    responsable:
      inc.trabajador?.nombre || inc.jefe?.nombre || 'Sin asignar',
    descripcion: inc.descripcion,
    valor: Number(inc.valor || 0),
  }));

  const totalPerdidas = detalle.reduce((acc, item) => acc + item.valor, 0);

  return {
    anio,
    mes,
    incidentes: detalle,
    total_perdidas: totalPerdidas,
  };
};