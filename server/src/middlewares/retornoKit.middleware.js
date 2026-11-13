import { validarBody, camposObligatorios } from './validate.middleware.js';
import { validarRegistrarRetorno } from '../schemas/retornoKit.schemas.js';
import { manejarError } from '../utils/errores.js';

export const verificarRegistrarRetorno = (req, res, next) => {
  try {
    req.body = validarRegistrarRetorno(req.body);
    next();
  } catch (error) {
    return manejarError(res, error);
  }
};

// POST /api/retorno-kits
export const registrarRetornoMiddleware = [
  validarBody,
  camposObligatorios('id_salida', 'revisiones'),
  verificarRegistrarRetorno,
];