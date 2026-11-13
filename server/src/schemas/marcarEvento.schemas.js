import { ValidationError } from '../utils/errores.js';

export const validarIdEventoRealizado = (id_evento) => {
  const n = Number(id_evento);
  if (id_evento === undefined || id_evento === null || id_evento === '' || !Number.isInteger(n) || n <= 0) {
    throw new ValidationError('El parámetro id_evento debe ser un entero positivo', 'id_evento');
  }
  return n;
};