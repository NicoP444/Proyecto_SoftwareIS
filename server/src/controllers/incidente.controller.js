import { createIncidenteService, getIncidentesService } from '../services/incidente.service.js';

export const registrarIncidente = async (req, res, next) => {
  try {
    // Si manejas sesión o auth, req.user suele traer id_jefe. Si no, se envía en el body de prueba.
    const id_jefe = req.user?.id_jefe || req.body.id_jefe || 1;

    const incidente = await createIncidenteService(req.body, id_jefe);
    res.status(201).json({
      message: 'Incidente registrado exitosamente.',
      data: incidente,
    });
  } catch (error) {
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