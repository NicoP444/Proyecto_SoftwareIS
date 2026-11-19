import prisma from '../config/prisma.js';
import { ValidationError } from '../utils/errores.js';

const ETIQUETA_ESTADO_RETORNO = {
  DANADO: 'dañado',
  PERDIDO: 'perdido',
  ROBADO: 'robado',
};

// Obtener salidas activas con kits que están actualmente en terreno y sin retorno registrado
export const obtenerKitsEnTerrenoService = async () => {
  return await prisma.salidaKit.findMany({
    where: {
      fecha_hora_retorno: null,
      reserva: {
        kit: {
          estado: 'EN_TERRENO',
        },
      },
    },
    include: {
      reserva: {
        include: {
          evento: true,
          kit: {
            include: {
              equipos: true,
            },
          },
        },
      },
      responsable: {
        include: {
          trabajador: true,
        },
      },
    },
    orderBy: {
      fecha_hora_salida: 'desc',
    },
  });
};

// Registrar la revisión de retorno (RF-P6-02) e incidente si aplica (RF-P6-03)
export const registrarRetornoService = async ({ id_salida, id_jefe, revisiones }) => {
  return await prisma.$transaction(async (tx) => {
    const salida = await tx.salidaKit.findUnique({
      where: { id_salida: Number(id_salida) },
      include: {
        reserva: {
          include: {
            kit: { include: { equipos: true } },
            evento: true,
          },
        },
        responsable: true,
      },
    });

    if (!salida) {
      throw new ValidationError('La salida especificada no existe.');
    }

    if (salida.fecha_hora_retorno) {
      throw new ValidationError('Esta salida ya tiene un retorno registrado.');
    }

    if (salida.reserva.kit.estado !== 'EN_TERRENO') {
      throw new ValidationError('El kit no figura En terreno; no se puede registrar el retorno.');
    }

    // Validar que el retorno se registre después de la hora de término del evento
    const evento = salida.reserva.evento;
    if (evento?.fecha && evento?.hora_termino) {
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
          `No se puede registrar el retorno antes de que finalice el evento (${finEvento.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}).`
        );
      }
    }

    const codigosKit = salida.reserva.kit.equipos.map((e) => e.codigo);
    const enviados = revisiones.map((r) => r.codigo);

    if (new Set(enviados).size !== enviados.length) {
      throw new ValidationError('Hay equipos repetidos en la revisión.');
    }

    const sobran = enviados.filter((c) => !codigosKit.includes(c));
    if (sobran.length) {
      throw new ValidationError(`Los equipos ${sobran.join(', ')} no pertenecen a este kit.`);
    }

    const faltan = codigosKit.filter((c) => !enviados.includes(c));
    if (faltan.length) {
      throw new ValidationError(`Falta revisar: ${faltan.join(', ')}.`);
    }

    let hayIncidente = false;

    for (const rev of revisiones) {
      let estadoRetornoNormalizado = rev.estado_retorno;
      if (['DANO', 'DANADO'].includes(rev.estado_retorno)) {
        estadoRetornoNormalizado = 'DANADO';
      } else if (['PERDIDA', 'PERDIDO'].includes(rev.estado_retorno)) {
        estadoRetornoNormalizado = 'PERDIDO';
      } else if (rev.estado_retorno === 'ROBO') {
        estadoRetornoNormalizado = 'ROBADO';
      }

      await tx.revisa.create({
        data: {
          id_salida: salida.id_salida,
          codigo: rev.codigo,
          estado_retorno: estadoRetornoNormalizado,
          observacion: rev.observacion || null,
        },
      });

      const esIncidente = ['DANADO', 'PERDIDO', 'ROBADO'].includes(estadoRetornoNormalizado);

      if (esIncidente) {
        hayIncidente = true;

        const equipo = await tx.equipo.findUnique({ where: { codigo: rev.codigo } });
        const yaRegistrado = equipo?.estado === estadoRetornoNormalizado;

        if (!yaRegistrado) {
          let valorIncidente = 0;
          if (estadoRetornoNormalizado === 'DANADO') {
            valorIncidente = Number(rev.costo_reparacion) || 0;
          } else {
            valorIncidente = equipo?.valor_compra || 0;
          }

          let tipoIncidente = 'DANO';
          if (estadoRetornoNormalizado === 'PERDIDO') tipoIncidente = 'PERDIDA';
          if (estadoRetornoNormalizado === 'ROBADO') tipoIncidente = 'ROBO';

          const etiquetaEstado =
            ETIQUETA_ESTADO_RETORNO[estadoRetornoNormalizado] ||
            estadoRetornoNormalizado.toLowerCase();

          await tx.incidente.create({
            data: {
              tipo: tipoIncidente,
              fecha: new Date(),
              descripcion: rev.observacion?.trim() || `Incidente reportado en retorno (${etiquetaEstado})`,
              valor: Math.round(valorIncidente),
              codigo: rev.codigo,
              id_evento: salida.reserva.id_evento,
              id_trabajador: salida.responsable.id_trabajador,
              id_jefe: Number(id_jefe),
            },
          });
        }

        await tx.equipo.update({
          where: { codigo: rev.codigo },
          data: {
            estado: estadoRetornoNormalizado,
          },
        });
      } else {
        await tx.equipo.update({
          where: { codigo: rev.codigo },
          data: { estado: 'OPERATIVO' },
        });
      }
    }

    await tx.salidaKit.update({
      where: { id_salida: salida.id_salida },
      data: { fecha_hora_retorno: new Date() },
    });

    const nuevoEstadoKit = hayIncidente ? 'INCOMPLETO' : 'DISPONIBLE';

    await tx.kit.update({
      where: { id_kit: salida.reserva.id_kit },
      data: { estado: nuevoEstadoKit },
    });

    return {
      mensaje: hayIncidente
        ? 'Retorno registrado con incidentes. El kit quedó Incompleto y se generó el incidente.'
        : 'Retorno registrado con éxito. Todos los equipos operativos, kit Disponible.',
      estado_kit: nuevoEstadoKit,
    };
  });
};