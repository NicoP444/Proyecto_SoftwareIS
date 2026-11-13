import { validarQueryInventario } from '../schemas/consultarInventario.schemas.js';
import { manejarError } from '../utils/errores.js';

export const verificarQueryInventario = (req, res, next) => {
  try {
    req.queryValidado = validarQueryInventario(req.query);
    next();
  } catch (error) {
    return manejarError(res, error);
  }
};

export const consultarInventarioMiddleware = [
  verificarQueryInventario,
];