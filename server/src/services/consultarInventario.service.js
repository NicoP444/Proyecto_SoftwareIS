import prisma from '../config/prisma.js';

export const consultarInventarioService = async () => {
  const ahora = new Date();

  // 1. Kits con nivel, estado, equipos integrantes y próximos eventos
  const kits = await prisma.kit.findMany({
    include: {
      equipos: {
        select: {
          codigo: true,
          nombre: true,
          categoria: true,
          marca: true,
          modelo: true,
          estado: true,
        },
      },
      reservas: {
        where: {
          evento: {
            fecha: { gte: ahora },
          },
        },
        include: {
          evento: {
            select: {
              id_evento: true,
              tipo: true,
              fecha: true,
              hora_inicio: true,
              hora_termino: true,
              direccion: true,
              estado: true,
            },
          },
        },
        orderBy: {
          evento: { fecha: 'asc' },
        },
      },
    },
    orderBy: { nombre: 'asc' },
  });

  const kitsFormateados = kits.map((k) => ({
    id_kit: k.id_kit,
    nombre: k.nombre,
    nivel: k.nivel,
    estado: k.estado,
    recargo_pct: k.recargo_pct,
    equipos: k.equipos,
    proximosEventos: k.reservas.map((r) => r.evento),
  }));

  // 2. Repuestos: Equipos operativos que NO pertenecen a ningún kit (RF-P5-07)
  const repuestos = await prisma.equipo.findMany({
    where: {
      id_kit: null,
      estado: 'OPERATIVO',
    },
    orderBy: { nombre: 'asc' },
  });

  // 3. Todos los equipos para búsqueda global y totales
  const todosLosEquipos = await prisma.equipo.findMany({
    include: {
      kit: { select: { nombre: true } },
    },
    orderBy: { nombre: 'asc' },
  });

  // 4. Totales por categoría y por estado
  const totalesPorCategoria = {};
  const totalesPorEstado = {};

  todosLosEquipos.forEach((eq) => {
    totalesPorCategoria[eq.categoria] = (totalesPorCategoria[eq.categoria] || 0) + 1;
    totalesPorEstado[eq.estado] = (totalesPorEstado[eq.estado] || 0) + 1;
  });

  return {
    kits: kitsFormateados,
    repuestos,
    todosLosEquipos,
    resumen: {
      totalEquipos: todosLosEquipos.length,
      totalesPorCategoria,
      totalesPorEstado,
    },
  };
};