import { ValidationError } from '../utils/errores.js';

export const validarCrearHistorialCambio = (body) => {
  const { tabla_afectada, dato, id_evento } = body;

  if (typeof tabla_afectada !== 'string' || tabla_afectada.trim() === '') {
    throw new ValidationError('La tabla afectada no es válida', 'tabla_afectada');
  }
  if (typeof dato !== 'string' || dato.trim() === '') {
    throw new ValidationError('El dato modificado no es válido', 'dato');
  }
  if (id_evento !== undefined && id_evento !== null) {
    if (!Number.isInteger(Number(id_evento)) || Number(id_evento) <= 0) {
      throw new ValidationError('El id del evento no es válido', 'id_evento');
    }
  }
};