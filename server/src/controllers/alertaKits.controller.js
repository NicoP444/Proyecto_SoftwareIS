import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getKitsSinRetorno = async (req, res) => {
  try {
    const ahora = new Date();
    // Umbral de 24 horas atrás
    const hace24Horas = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

    // Buscamos kits que estén en terreno
    const kitsEnTerreno = await prisma.kit.findMany({
      where: {
        estado: 'EN_TERRENO'
      },
      include: {
        reservas: {
          include: {
            evento: true,
            salida: {
              include: {
                responsable: {
                  include: {
                    trabajador: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const alertas = [];

    for (const kit of kitsEnTerreno) {
      // Buscar reservas que tengan salida activa sin retorno
      for (const reserva of kit.reservas) {
        const salida = reserva.salida;
        const evento = reserva.evento;

        if (salida && !salida.fecha_hora_retorno && evento) {
          // Combinar fecha del evento con hora_termino
          const fechaEventoStr = new Date(evento.fecha).toISOString().split('T')[0];
          const horaTerminoStr = new Date(evento.hora_termino).toISOString().split('T')[1];
          const fechaFinEvento = new Date(`${fechaEventoStr}T${horaTerminoStr}`);

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
              telefono_responsable: salida.responsable?.trabajador?.telefono_whatsapp || null
            });
          }
        }
      }
    }

    res.json(alertas);
  } catch (error) {
    console.error('Error al consultar kits sin retorno:', error);
    res.status(500).json({ mensaje: 'Error al obtener alertas de kits sin retorno' });
  }
};