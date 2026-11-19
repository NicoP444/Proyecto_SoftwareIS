import { validarBody, camposObligatorios } from './validate.middleware.js';
import { validarCrearIncidente, validarIdEventoParam } from '../schemas/incidente.schemas.js';
import { manejarError } from '../utils/errores.js';

export const verificarCrearIncidente = (req, res, next) => {
  try {
    req.body = validarCrearIncidente(req.body);
    next();
  } catch (error) {
    return manejarError(res, error);
  }
};

export const verificarIdEventoIncidente = (req, res, next) => {
  try {
    req.params.id_evento = validarIdEventoParam(req.params.id_evento);
    next();
  } catch (error) {
    return manejarError(res, error);
  }
};

// POST /api/incidentes
export const crearIncidenteMiddleware = [
  validarBody,
  camposObligatorios('codigo', 'tipo', 'descripcion'),
  verificarCrearIncidente,
];

// GET /api/incidentes/evento/:id_evento
export const listarIncidentesEventoMiddleware = [
  verificarIdEventoIncidente,
];