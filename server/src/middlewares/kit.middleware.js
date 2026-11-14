import { validarBody, camposObligatorios } from './validate.middleware.js';
import { validarCrearKit } from '../schemas/kit.schemas.js';
import { manejarError } from '../utils/errores.js';

export const verificarCrearKit = (req, res, next) => {
  try {
    req.body = validarCrearKit(req.body);
    next();
  } catch (error) {
    return manejarError(res, error);
  }
};

// POST /api/kits
export const crearKitMiddleware = [
  validarBody,
  camposObligatorios('nombre', 'nivel', 'equipos'),
  verificarCrearKit,
];