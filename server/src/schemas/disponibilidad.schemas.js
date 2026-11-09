import { ValidationError } from '../utils/errores.js';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;   // AAAA-MM-DD
const HORA = /^\d{2}:\d{2}$/;          // HH:MM

export const validarDisponibilidad = (body) => {
  const { fecha_inicio, fecha_termino, hora_inicio, hora_termino } = body;

  if (!FECHA.test(fecha_inicio)) throw new ValidationError('La fecha de inicio no es válida', 'fecha_inicio');
  if (!FECHA.test(fecha_termino)) throw new ValidationError('La fecha de término no es válida', 'fecha_termino');
  if (!HORA.test(hora_inicio)) throw new ValidationError('La hora de inicio no es válida', 'hora_inicio');
  if (!HORA.test(hora_termino)) throw new ValidationError('La hora de término no es válida', 'hora_termino');

  if (fecha_termino < fecha_inicio)
    throw new ValidationError('La fecha de término no puede ser anterior a la de inicio', 'fecha_termino');
  if (hora_termino <= hora_inicio)
    throw new ValidationError('La hora de término debe ser posterior a la de inicio', 'hora_termino');

  return {
    fecha_inicio: new Date(`${fecha_inicio}T00:00:00Z`),
    fecha_termino: new Date(`${fecha_termino}T00:00:00Z`),
    hora_inicio: new Date(`1970-01-01T${hora_inicio}:00Z`),
    hora_termino: new Date(`1970-01-01T${hora_termino}:00Z`),
  };
};