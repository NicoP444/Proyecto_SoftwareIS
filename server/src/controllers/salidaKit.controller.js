import {
  registrarSalidaKitService,
  obtenerKitsYPersonalPorEventoService,
  obtenerEventosConReservasService,
} from '../services/salidaKit.service.js';
import { manejarError } from '../utils/errores.js';

export const registrarSalidaKit = async (req, res) => {
  try {
    const { id_reserva, id_asignacion, fecha_hora_salida } = req.body;
    const jefeId = req.usuario?.id_jefe || req.user?.id_jefe;

    if (!jefeId) {
      return res.status(401).json({ mensaje: 'No se pudo identificar al Jefe de área técnica desde la sesión.' });
    }

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
    return manejarError(res, error);
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
    return manejarError(res, error);
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