import prisma from '../config/prisma.js';

/**
 * RF-P6-01: Registrar salida de un kit asignado a un evento
 */
export const registrarSalidaKitService = async ({ id_reserva, id_asignacion, id_jefe, fecha_hora_salida }) => {
  // 1. Validar que la reserva exista y obtener estado actual del kit
  const reserva = await prisma.reservaKit.findUnique({
    where: { id_reserva: Number(id_reserva) },
    include: {
      kit: true,
      salida: true,
    },
  });

  if (!reserva) {
    throw new Error('La reserva del kit no existe');
  }

  if (reserva.salida) {
    throw new Error('Este kit ya tiene registrada una salida para este evento');
  }

  if (reserva.kit.estado === 'EN_TERRENO') {
    throw new Error('El kit ya figura actualmente con estado "EN_TERRENO"');
  }

  // 2. Transacción atómica: se registra la salida y se pasa el kit a EN_TERRENO
  const resultado = await prisma.$transaction(async (tx) => {
    const nuevaSalida = await tx.salidaKit.create({
      data: {
        id_reserva: Number(id_reserva),
        id_asignacion: Number(id_asignacion),
        id_jefe: Number(id_jefe),
        fecha_hora_salida: fecha_hora_salida ? new Date(fecha_hora_salida) : new Date(),
      },
    });

    await tx.kit.update({
      where: { id_kit: reserva.id_kit },
      data: { estado: 'EN_TERRENO' },
    });

    return nuevaSalida;
  });

  return resultado;
};

/**
 * Consulta auxiliar para el frontend:
 * Obtiene los kits reservados para un evento, con su estado y las personas asignadas
 */
export const obtenerKitsYPersonalPorEventoService = async (id_evento) => {
  const reservas = await prisma.reservaKit.findMany({
    where: { id_evento: Number(id_evento) },
    include: {
      kit: true,
      salida: {
        include: {
          responsable: {
            include: {
              trabajador: true,
            },
          },
        },
      },
    },
  });

  // Buscamos también el personal asignado al evento para que el select del responsable se llene solo
  const evento = await prisma.evento.findUnique({
    where: { id_evento: Number(id_evento) },
    include: {
      asignaciones: {
        include: {
          trabajador: true,
          rol: true,
        },
      },
    },
  });

  return {
    reservas,
    personalAsignado: evento?.asignaciones || [],
  };
};

export const obtenerEventosConReservasService = async () => {
  return await prisma.evento.findMany({
    where: {
      reservas_kit: {
        some: {},
      },
    },
    select: {
      id_evento: true,
      tipo: true,
      direccion: true,
      fecha: true,
    },
    orderBy: {
      fecha: 'desc',
    },
  });
};