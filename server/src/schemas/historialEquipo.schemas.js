import { ValidationError } from '../utils/errores.js';

const CODIGO_EQUIPO = /^[A-Za-z0-9_-]+$/;

export const validarCodigoEquipo = (codigo) => {
  if (codigo === undefined || codigo === null || String(codigo).trim() === '') {
    throw new ValidationError('El código del equipo es obligatorio', 'codigo');
  }

  const limpio = String(codigo).trim().toUpperCase();

  if (limpio.length > 30) {
    throw new ValidationError('El código del equipo no puede superar los 30 caracteres', 'codigo');
  }

  if (!CODIGO_EQUIPO.test(limpio)) {
    throw new ValidationError(
      'El código del equipo solo puede contener letras, números, guiones (-) o guiones bajos (_)',
      'codigo'
    );
  }

  return limpio;
};