import { validarBody } from './validate.middleware.js';
import { validarCrearKit, validarModificarKit } from '../schemas/kit.schemas.js';
import { manejarError } from '../utils/errores.js';

export const verificarCrearKit = (req, res, next) => {
  try {
    req.body = validarCrearKit(req.body);
    next();
  } catch (error) {
    return manejarError(res, error);
  }
};

export const verificarModificarKit = (req, res, next) => {
  try {
    req.body = validarModificarKit(req.body);
    next();
  } catch (error) {
    return manejarError(res, error);
  }
};

export const crearKitMiddleware = [
  validarBody,
  verificarCrearKit,
];

export const actualizarKitMiddleware = [
  validarBody,
  verificarModificarKit,
];