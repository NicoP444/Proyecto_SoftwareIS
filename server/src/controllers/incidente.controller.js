import {
  createIncidenteService,
  getIncidentesService,
  getIncidentesPorEventoService,
} from '../services/incidente.service.js';

export const registrarIncidente = async (req, res, next) => {
  try {
    const id_jefe = req.usuario?.id_jefe || req.user?.id_jefe;

    if (!id_jefe) {
      return res.status(401).json({ mensaje: 'No se pudo identificar al Jefe de área técnica desde la sesión.' });
    }

    const incidente = await createIncidenteService(req.body, id_jefe);
    res.status(201).json({
      message: 'Incidente registrado exitosamente.',
      data: incidente,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ mensaje: error.message });
    }
    next(error);
  }
};

export const listarIncidentes = async (req, res, next) => {
  try {
    const incidentes = await getIncidentesService();
    res.status(200).json({ data: incidentes });
  } catch (error) {
    next(error);
  }
};

export const obtenerIncidentesPorEvento = async (req, res, next) => {
  try {
    const { id_evento } = req.params;
    if (!id_evento) {
      return res.status(400).json({ error: 'El parámetro id_evento es obligatorio.' });
    }

    const data = await getIncidentesPorEventoService(id_evento);
    return res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};