import {
  registrarSalidaKitService,
  obtenerKitsYPersonalPorEventoService,
  obtenerEventosConReservasService,
} from '../services/salidaKit.service.js';

export const registrarSalidaKit = async (req, res) => {
  try {
    const { id_reserva, id_asignacion, id_jefe, fecha_hora_salida } = req.body;

    if (!id_reserva || !id_asignacion) {
      return res.status(400).json({
        message: 'id_reserva e id_asignacion son campos obligatorios',
      });
    }

    // Si tu middleware guarda el usuario en req.user usa ese id, sino el enviado en body o 1 por defecto
    const jefeId = req.user?.id_jefe || id_jefe || 1;

    const salida = await registrarSalidaKitService({
      id_reserva,
      id_asignacion,
      id_jefe: jefeId,
      fecha_hora_salida,
    });

    return res.status(201).json({
      message: 'Salida de kit registrada exitosamente',
      data: salida,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const obtenerKitsPorEvento = async (req, res) => {
  try {
    const { id_evento } = req.params;

    if (!id_evento) {
      return res.status(400).json({ message: 'El id_evento es requerido' });
    }

    const data = await obtenerKitsYPersonalPorEventoService(id_evento);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Obtener eventos que tienen kits reservados listos para despacho
export const obtenerEventosConReservas = async (req, res) => {
  try {
    const eventos = await obtenerEventosConReservasService();
    res.json(eventos);
  } catch (error) {
    console.error('Error al listar eventos con reservas:', error);
    res.status(500).json({ mensaje: 'Error al obtener eventos con reservas' });
  }
};