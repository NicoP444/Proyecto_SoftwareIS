import { validarIdEventoRealizado } from '../schemas/marcarEvento.schemas.js';
import { manejarError } from '../utils/errores.js';

export const verificarIdEventoRealizado = (req, res, next) => {
  try {
    req.params.id_evento = validarIdEventoRealizado(req.params.id_evento);
    next();
  } catch (error) {
    return manejarError(res, error);
  }
};

// PATCH /api/marcar-evento/:id_evento/realizado
export const marcarEventoRealizadoMiddleware = [
  verificarIdEventoRealizado,
];