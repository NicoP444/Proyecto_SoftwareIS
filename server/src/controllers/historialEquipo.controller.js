import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const obtenerHistorialEquipo = async (req, res) => {
  const { codigo } = req.params;

  try {
    // Buscar la ficha del equipo junto con sus incidentes y revisiones de salidas
    const equipo = await prisma.equipo.findUnique({
      where: { codigo },
      include: {
        incidentes: {
          include: {
            evento: { select: { id_evento: true, tipo: true, fecha: true } },
            trabajador: { select: { id_trabajador: true, nombre: true } }
          }
        },
        revisiones: {
          include: {
            salida: {
              include: {
                reserva: {
                  include: {
                    evento: { select: { id_evento: true, tipo: true, fecha: true } },
                    kit: { select: { id_kit: true, nombre: true } }
                  }
                },
                responsable: {
                  include: {
                    trabajador: { select: { id_trabajador: true, nombre: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!equipo) {
      return res.status(404).json({ mensaje: 'Equipo no encontrado' });
    }

    // Unificar eventos en la línea de tiempo
    const eventosHistorial = [];

    // Adquisición inicial
    if (equipo.fecha_compra) {
      eventosHistorial.push({
        tipo: 'COMPRA',
        fecha: equipo.fecha_compra,
        descripcion: 'Ingreso al inventario operativo',
        evento: null,
        responsable: null,
        detalle: { valor_compra: equipo.valor_compra }
      });
    }

    // Salidas y Retornos de kits
    equipo.revisiones.forEach((rev) => {
      const salida = rev.salida;
      const eventoRef = salida?.reserva?.evento;
      const trabajador = salida?.responsable?.trabajador;

      if (salida?.fecha_hora_salida) {
        eventosHistorial.push({
          tipo: 'SALIDA',
          fecha: salida.fecha_hora_salida,
          descripcion: `Salida a terreno en kit: ${salida.reserva.kit.nombre}`,
          evento: eventoRef ? `${eventoRef.tipo} (#${eventoRef.id_evento})` : null,
          responsable: trabajador ? trabajador.nombre : 'No asignado',
          detalle: null
        });
      }

      if (salida?.fecha_hora_retorno) {
        eventosHistorial.push({
          tipo: 'RETORNO',
          fecha: salida.fecha_hora_retorno,
          descripcion: `Retorno de terreno - Estado: ${rev.estado_retorno}`,
          evento: eventoRef ? `${eventoRef.tipo} (#${eventoRef.id_evento})` : null,
          responsable: trabajador ? trabajador.nombre : 'No asignado',
          detalle: {
            estado_retorno: rev.estado_retorno,
            observacion: rev.observacion
          }
        });
      }
    });

    // Incidentes (daño, pérdida, robo)
    equipo.incidentes.forEach((inc) => {
      eventosHistorial.push({
        tipo: 'INCIDENTE',
        fecha: inc.fecha,
        descripcion: `Incidente registrado: ${inc.tipo} - ${inc.descripcion}`,
        evento: inc.evento ? `${inc.evento.tipo} (#${inc.evento.id_evento})` : 'Fuera de evento',
        responsable: inc.trabajador ? inc.trabajador.nombre : 'No asignado',
        detalle: {
          tipo_incidente: inc.tipo,
          costo_asociado: inc.valor
        }
      });
    });

    // Registro de Baja si aplica
    if (equipo.fecha_baja) {
      eventosHistorial.push({
        tipo: 'BAJA',
        fecha: equipo.fecha_baja,
        descripcion: `Equipo dado de baja: ${equipo.motivo_baja || 'Sin motivo especificado'}`,
        evento: null,
        responsable: null,
        detalle: { motivo: equipo.motivo_baja }
      });
    }

    // Orden cronológico: el más reciente primero
    eventosHistorial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return res.json({
      equipo: {
        codigo: equipo.codigo,
        nombre: equipo.nombre,
        categoria: equipo.categoria,
        marca: equipo.marca,
        modelo: equipo.modelo,
        estado_actual: equipo.estado
      },
      historial: eventosHistorial
    });
  } catch (error) {
    console.error('Error al consultar historial del equipo:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar el historial' });
  }
};