import prisma from '../config/prisma.js';
import { ValidationError } from '../utils/errores.js';

// Helper reutilizable para verificar si un evento ya cumplió todas las condiciones de cierre
const estaListoParaRealizar = (evento, ahora = new Date()) => {
  if (!evento || evento.estado !== 'CONFIRMADO') return false;

  // 1. Debe tener al menos un trabajador asignado
  if (!evento.asignaciones || evento.asignaciones.length === 0) return false;

  // 2. Si tiene kits reservados:
  // - Al menos uno debe haber salido y retornado a bodega
  // - Ninguno que haya salido puede seguir en terreno sin retorno
  const reservas = evento.reservas_kit || [];
  if (reservas.length > 0) {
    const alMenosUnoRetornado = reservas.some(
      (r) => r.salida && r.salida.fecha_hora_retorno
    );
    const algunoSinRetornar = reservas.some(
      (r) => r.salida && !r.salida.fecha_hora_retorno
    );
    if (!alMenosUnoRetornado || algunoSinRetornar) return false;
  }

  // 3. Debe haber superado su hora de término
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

export const marcarEventoRealizadoService = async (id_evento) => {
  return await prisma.$transaction(async (tx) => {
    const evento = await tx.evento.findUnique({
      where: { id_evento: Number(id_evento) },
      include: {
        asignaciones: true,
        reservas_kit: {
          include: {
            kit: true,
            salida: true,
          },
        },
      },
    });

    if (!evento) {
      const error = new Error('El evento especificado no existe.');
      error.statusCode = 404;
      throw error;
    }

    if (evento.estado !== 'CONFIRMADO') {
      throw new ValidationError(
        `Solo se puede marcar como realizado un evento en estado CONFIRMADO. Estado actual: ${evento.estado}.`
      );
    }

    if (!evento.asignaciones || evento.asignaciones.length === 0) {
      throw new ValidationError(
        'No se puede marcar como realizado: el evento no tiene personal asignado.'
      );
    }

    if (evento.reservas_kit.length > 0) {
      const kitsSinRetornar = evento.reservas_kit.filter(
        (r) => r.salida && !r.salida.fecha_hora_retorno
      );
      if (kitsSinRetornar.length > 0) {
        const nombres = kitsSinRetornar.map((r) => r.kit?.nombre || `Kit #${r.id_kit}`).join(', ');
        throw new ValidationError(
          `No se puede marcar como realizado: aún hay kits en terreno sin retorno (${nombres}).`
        );
      }

      const alMenosUnoRetornado = evento.reservas_kit.some(
        (r) => r.salida && r.salida.fecha_hora_retorno
      );
      if (!alMenosUnoRetornado) {
        throw new ValidationError(
          'No se puede marcar como realizado: debe haberse despachado y retornado al menos un kit reservado.'
        );
      }
    }

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

    if (new Date() < finEvento) {
      throw new ValidationError(
        `No se puede marcar como realizado antes de su hora de término (${finEvento.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}).`
      );
    }

    const eventoActualizado = await tx.evento.update({
      where: { id_evento: Number(id_evento) },
      data: {
        estado: 'REALIZADO',
      },
    });

    await tx.asignacionPersonal.updateMany({
      where: { id_evento: Number(id_evento) },
      data: {
        estado_rendicion: 'PENDIENTE',
      },
    });

    return eventoActualizado;
  });
};

export const listarEventosParaRealizarService = async () => {
  const ahora = new Date();

  const candidatos = await prisma.evento.findMany({
    where: {
      estado: 'CONFIRMADO',
      fecha: {
        lte: ahora,
      },
      // Excluir en BD los eventos que no tienen ningún trabajador asignado
      asignaciones: {
        some: {},
      },
    },
    include: {
      cliente: true,
      asignaciones: {
        include: {
          trabajador: { select: { id_trabajador: true, nombre: true } },
        },
      },
      reservas_kit: {
        include: {
          kit: true,
          salida: true,
        },
      },
    },
    orderBy: { fecha: 'asc' },
  });

  // Devolver únicamente los que ya terminaron su horario y tienen sus kits devueltos
  return candidatos.filter((ev) => estaListoParaRealizar(ev, ahora));
};