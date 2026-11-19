import prisma from '../config/prisma.js';

export const createIncidenteService = async (data, id_jefe) => {
  const { tipo, fecha, descripcion, codigo, id_evento, id_trabajador, costo_reparacion } = data;

  return await prisma.$transaction(async (tx) => {
    // 1. Obtener y verificar el equipo
    const equipo = await tx.equipo.findUnique({
      where: { codigo },
    });

    if (!equipo) {
      const error = new Error('El equipo especificado no existe.');
      error.statusCode = 404;
      throw error;
    }

    if (equipo.estado !== 'OPERATIVO') {
      const error = new Error(`El equipo figura actualmente como ${equipo.estado}; solo se pueden registrar incidentes en equipos OPERATIVOS.`);
      error.statusCode = 400;
      throw error;
    }

    // Verificar existencia y estado del evento si fue enviado
    if (id_evento) {
      const eventoExiste = await tx.evento.findUnique({
        where: { id_evento: Number(id_evento) },
        select: { id_evento: true, estado: true },
      });
      if (!eventoExiste) {
        const error = new Error('El evento especificado no existe.');
        error.statusCode = 404;
        throw error;
      }
      if (!['CONFIRMADO', 'REALIZADO'].includes(eventoExiste.estado)) {
        const error = new Error('Solo se pueden asociar incidentes a eventos CONFIRMADOS o REALIZADOS.');
        error.statusCode = 400;
        throw error;
      }
    }

    if (id_trabajador) {
      const trabajadorExiste = await tx.trabajador.findUnique({
        where: { id_trabajador: Number(id_trabajador) },
        select: { id_trabajador: true },
      });
      if (!trabajadorExiste) {
        const error = new Error('El trabajador especificado no existe.');
        error.statusCode = 404;
        throw error;
      }
    }

    // 2. Determinar el valor del incidente y nuevo estado del equipo según RF-P6-03
    let valorIncidente = 0;
    let nuevoEstadoEquipo = equipo.estado;

    if (tipo === 'DANO') {
      if (costo_reparacion === undefined || costo_reparacion === null || Number(costo_reparacion) < 0) {
        const error = new Error('Para daños se requiere el costo estimado de reparación.');
        error.statusCode = 400;
        throw error;
      }
      valorIncidente = Math.round(Number(costo_reparacion));
      nuevoEstadoEquipo = 'DANADO';
    } else if (tipo === 'PERDIDA') {
      valorIncidente = equipo.valor_compra;
      nuevoEstadoEquipo = 'PERDIDO';
    } else if (tipo === 'ROBO') {
      valorIncidente = equipo.valor_compra;
      nuevoEstadoEquipo = 'ROBADO';
    } else {
      const error = new Error('Tipo de incidente inválido.');
      error.statusCode = 400;
      throw error;
    }

    // 3. Crear el registro del incidente
    const nuevoIncidente = await tx.incidente.create({
      data: {
        tipo,
        fecha: fecha ? new Date(fecha) : new Date(),
        descripcion,
        valor: valorIncidente,
        codigo,
        id_evento: id_evento ? Number(id_evento) : null,
        id_trabajador: id_evento && id_trabajador ? Number(id_trabajador) : null,
        id_jefe: Number(id_jefe),
      },
      include: {
        equipo: true,
        evento: true,
        trabajador: true,
      },
    });

    // 4. Actualizar el estado del equipo y marcar su kit como INCOMPLETO si pertenece a uno
    await tx.equipo.update({
      where: { codigo },
      data: { estado: nuevoEstadoEquipo },
    });

    if (equipo.id_kit) {
      await tx.kit.updateMany({
        where: { id_kit: equipo.id_kit, estado: { not: 'EN_TERRENO' } },
        data: { estado: 'INCOMPLETO' },
      });
    }

    return nuevoIncidente;
  });
};

export const getIncidentesService = async () => {
  return await prisma.incidente.findMany({
    include: {
      equipo: { select: { codigo: true, nombre: true, categoria: true, estado: true } },
      evento: { select: { id_evento: true, tipo: true, fecha: true } },
      trabajador: { select: { id_trabajador: true, nombre: true } },
      jefe: { select: { id_jefe: true, nombre: true } },
    },
    orderBy: [{ fecha: 'desc' }, { id_incidente: 'desc' }],
  });
};

/**
 * Obtener resumen de incidentes por evento (RF-P6-06)
 */
export const getIncidentesPorEventoService = async (id_evento) => {
  const incidentes = await prisma.incidente.findMany({
    where: {
      id_evento: Number(id_evento),
    },
    include: {
      equipo: {
        select: {
          codigo: true,
          nombre: true,
          categoria: true,
        },
      },
      trabajador: {
        select: {
          id_trabajador: true,
          nombre: true,
        },
      },
    },
    orderBy: [{ fecha: 'desc' }, { id_incidente: 'desc' }],
  });

  const totalPerdidas = incidentes.reduce((acc, inc) => acc + (inc.valor || 0), 0);

  return {
    id_evento: Number(id_evento),
    cantidad: incidentes.length,
    totalPerdidas,
    incidentes,
  };
};