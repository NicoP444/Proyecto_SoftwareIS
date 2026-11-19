import { validarCodigoEquipo } from '../schemas/historialEquipo.schemas.js';
import { manejarError } from '../utils/errores.js';

export const verificarCodigoEquipo = (req, res, next) => {
  try {
    req.params.codigo = validarCodigoEquipo(req.params.codigo);
    next();
  } catch (error) {
    return manejarError(res, error);
  }
};

export const historialEquipoMiddleware = [
  verificarCodigoEquipo,
];