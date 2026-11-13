import { validarBody, camposObligatorios } from './validate.middleware.js';
import { validarRegistrarSalidaKit, validarIdEventoSalida } from '../schemas/salidaKit.schemas.js';
import { manejarError } from '../utils/errores.js';

export const verificarRegistrarSalidaKit = (req, res, next) => {
  try {
    req.body = validarRegistrarSalidaKit(req.body);
    next();
  } catch (error) {
    return manejarError(res, error);
  }
};

export const verificarIdEventoSalida = (req, res, next) => {
  try {
    req.params.id_evento = validarIdEventoSalida(req.params.id_evento);
    next();
  } catch (error) {
    return manejarError(res, error);
  }
};

// POST /api/salida-kits
export const registrarSalidaKitMiddleware = [
  validarBody,
  camposObligatorios('id_reserva', 'id_asignacion'),
  verificarRegistrarSalidaKit,
];

// GET /api/salida-kits/evento/:id_evento
export const listarKitsEventoSalidaMiddleware = [
  verificarIdEventoSalida,
];