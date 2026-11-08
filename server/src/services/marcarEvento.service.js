import prisma from '../config/prisma.js';

export const marcarEventoRealizadoService = async (id_evento) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Buscar el evento y sus asignaciones de personal
    const evento = await tx.evento.findUnique({
      where: { id_evento: Number(id_evento) },
      include: {
        asignaciones: true,
      },
    });

    if (!evento) {
      const error = new Error('El evento especificado no existe.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Validar que el estado actual sea CONFIRMADO
    if (evento.estado !== 'CONFIRMADO') {
      const error = new Error(
        `Solo se puede marcar como realizado un evento en estado CONFIRMADO. Estado actual: ${evento.estado}.`
      );
      error.statusCode = 400;
      throw error;
    }

    // 3. Validar que ya haya pasado su hora de término
    // Se combina la fecha del evento con su hora_termino
    const fechaBase = new Date(evento.fecha);
    const horaTermino = new Date(evento.hora_termino);

    const finEvento = new Date(
      fechaBase.getUTCFullYear(),
      fechaBase.getUTCMonth(),
      fechaBase.getUTCDate(),
      horaTermino.getUTCHours(),
      horaTermino.getUTCMinutes(),
      horaTermino.getUTCSeconds()
    );

    const ahora = new Date();

    if (ahora < finEvento) {
      const error = new Error(
        `No se puede marcar como realizado antes de su hora de término (${finEvento.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`
      );
      error.statusCode = 400;
      throw error;
    }

    // 4. Cambiar el estado del evento a REALIZADO
    const eventoActualizado = await tx.evento.update({
      where: { id_evento: Number(id_evento) },
      data: {
        estado: 'REALIZADO',
      },
    });

    // 5. Postcondición: la rendición de cada trabajador asignado queda en PENDIENTE
    await tx.asignacionPersonal.updateMany({
      where: { id_evento: Number(id_evento) },
      data: {
        estado_rendicion: 'PENDIENTE',
      },
    });

    return eventoActualizado;
  });
};

// Función auxiliar para listar eventos confirmados que el Dueño pueda revisar y marcar
export const listarEventosParaRealizarService = async () => {
  const ahora = new Date();

  return await prisma.evento.findMany({
    where: {
      estado: 'CONFIRMADO',
      fecha: {
        lte: ahora,
      },
    },
    include: {
      cliente: true,
      asignaciones: {
        include: {
          trabajador: { select: { id_trabajador: true, nombre: true } },
        },
      },
    },
    orderBy: { fecha: 'asc' },
  });
};