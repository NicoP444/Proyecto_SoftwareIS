import prisma from '../config/prisma.js';

const calcularFinEvento = (evento) => {
  if (!evento?.fecha || !evento?.hora_termino) return null;

  const fechaBase = new Date(evento.fecha);
  const horaTermino = new Date(evento.hora_termino);

  const esMedianoche =
    horaTermino.getUTCHours() === 0 &&
    horaTermino.getUTCMinutes() === 0 &&
    horaTermino.getUTCSeconds() === 0;

  return new Date(
    fechaBase.getUTCFullYear(),
    fechaBase.getUTCMonth(),
    fechaBase.getUTCDate() + (esMedianoche ? 1 : 0),
    horaTermino.getUTCHours(),
    horaTermino.getUTCMinutes(),
    horaTermino.getUTCSeconds()
  );
};

export const obtenerKitsSinRetornoService = async () => {
  const ahora = new Date();
  // Umbral de 24 horas atrás
  const hace24Horas = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

  // Buscamos kits que estén en terreno
  const kitsEnTerreno = await prisma.kit.findMany({
    where: {
      estado: 'EN_TERRENO',
    },
    include: {
      reservas: {
        include: {
          evento: true,
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
      },
    },
  });

  const alertas = [];

  for (const kit of kitsEnTerreno) {
    // Buscar reservas que tengan salida activa sin retorno
    for (const reserva of kit.reservas) {
      const salida = reserva.salida;
      const evento = reserva.evento;

      if (salida && !salida.fecha_hora_retorno && evento) {
        const fechaFinEvento = calcularFinEvento(evento);
        if (!fechaFinEvento) continue;

        // Si el evento terminó hace más de 24 horas
        if (fechaFinEvento < hace24Horas) {
          const horasRetraso = Math.floor((ahora - fechaFinEvento) / (1000 * 60 * 60));
          alertas.push({
            id_kit: kit.id_kit,
            nombre_kit: kit.nombre,
            id_evento: evento.id_evento,
            tipo_evento: evento.tipo,
            direccion: evento.direccion,
            fecha_termino: fechaFinEvento.toISOString(),
            horas_retraso: horasRetraso,
            responsable: salida.responsable?.trabajador?.nombre || 'No asignado',
            telefono_responsable: salida.responsable?.trabajador?.telefono_whatsapp || null,
          });
        }
      }
    }
  }

  return alertas;
};