import prisma from '../config/prisma.js';
import { ValidationError } from '../utils/errores.js';

const eventoYaTermino = (evento, ahora = new Date()) => {
  const fechaBase = new Date(evento.fecha);
  const horaTermino = new Date(evento.hora_termino);

  const esMedianoche =
    horaTermino.getUTCHours() === 0 &&
    horaTermino.getUTCMinutes() === 0 &&
    horaTermino.getUTCSeconds() === 0;

  const finEvento = new Date(
    fechaBase.getUTCFullYear(),
    fechaBase.getUTCMonth(),
    fechaBase.getUTCDate() + (esMedianoche ? 1 : 0),
    horaTermino.getUTCHours(),
    horaTermino.getUTCMinutes(),
    horaTermino.getUTCSeconds()
  );

  return ahora >= finEvento;
};

/**
 * RF-P6-01: Registrar salida de un kit asignado a un evento
 */
export const registrarSalidaKitService = async ({ id_reserva, id_asignacion, id_jefe, fecha_hora_salida }) => {
  const reserva = await prisma.reservaKit.findUnique({
    where: { id_reserva: Number(id_reserva) },
    include: {
      kit: true,
      salida: true,
    },
  });

  if (!reserva) {
    throw new ValidationError('La reserva del kit no existe');
  }

  if (reserva.salida) {
    throw new ValidationError('Este kit ya tiene registrada una salida para este evento');
  }

  if (reserva.kit.estado === 'EN_TERRENO') {
    throw new ValidationError('El kit ya figura actualmente con estado "EN_TERRENO"');
  }

  if (reserva.kit.estado !== 'DISPONIBLE') {
    throw new ValidationError(`El kit está "${reserva.kit.estado}" y no puede salir de bodega`);
  }

  const evento = await prisma.evento.findUnique({
    where: { id_evento: reserva.id_evento },
    select: { estado: true, fecha: true, hora_inicio: true, hora_termino: true },
  });

  if (!evento || evento.estado !== 'CONFIRMADO') {
    throw new ValidationError('Solo se puede registrar la salida de kits de eventos CONFIRMADOS');
  }

  const ahora = new Date();
  const inicioHoyUTC = new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));
  const fechaEvento = new Date(evento.fecha);
  const fechaEventoUTC = new Date(
    Date.UTC(fechaEvento.getUTCFullYear(), fechaEvento.getUTCMonth(), fechaEvento.getUTCDate())
  );

  if (inicioHoyUTC < fechaEventoUTC) {
    throw new ValidationError(
      `No se puede registrar la salida antes de la fecha del evento (${fechaEvento.toLocaleDateString('es-CL', { timeZone: 'UTC' })}).`
    );
  }

  if (eventoYaTermino(evento, ahora)) {
    throw new ValidationError('No se puede registrar la salida de un kit para un evento que ya finalizó');
  }

  if (fecha_hora_salida && new Date(fecha_hora_salida) > new Date()) {
    throw new ValidationError('La fecha y hora de salida no puede ser futura');
  }

  const asignacion = await prisma.asignacionPersonal.findUnique({
    where: { id_asignacion: Number(id_asignacion) },
  });

  if (!asignacion || asignacion.id_evento !== reserva.id_evento) {
    throw new ValidationError('El trabajador seleccionado no está asignado a este evento');
  }

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

export const obtenerKitsYPersonalPorEventoService = async (id_evento) => {
  const reservas = await prisma.reservaKit.findMany({
    where: { id_evento: Number(id_evento) },
    include: {
      kit: {
        include: {
          equipos: true,
        },
      },
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
  const ahora = new Date();
  const finDeHoyUTC = new Date(
    Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999)
  );

  const candidatos = await prisma.evento.findMany({
    where: {
      estado: 'CONFIRMADO',
      fecha: {
        lte: finDeHoyUTC,
      },
      reservas_kit: {
        some: {},
      },
    },
    select: {
      id_evento: true,
      tipo: true,
      direccion: true,
      fecha: true,
      hora_inicio: true,
      hora_termino: true,
      estado: true,
    },
    orderBy: {
      fecha: 'desc',
    },
  });

  // Eventos de hoy o anteriores cuya transmisión aún no ha finalizado
  return candidatos.filter((ev) => !eventoYaTermino(ev, ahora));
};