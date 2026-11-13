import { ValidationError } from '../utils/errores.js';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;   // AAAA-MM-DD

export const validarDisponibilidad = (body) => {
  const { fecha_inicio, fecha_termino } = body;

  if (!FECHA.test(fecha_inicio)) throw new ValidationError('La fecha de inicio no es válida', 'fecha_inicio');
  if (!FECHA.test(fecha_termino)) throw new ValidationError('La fecha de término no es válida', 'fecha_termino');

  if (fecha_termino < fecha_inicio)
    throw new ValidationError('La fecha de término no puede ser anterior a la de inicio', 'fecha_termino');

  return {
    fecha_inicio: new Date(`${fecha_inicio}T00:00:00Z`),
    fecha_termino: new Date(`${fecha_termino}T00:00:00Z`),
  };
};