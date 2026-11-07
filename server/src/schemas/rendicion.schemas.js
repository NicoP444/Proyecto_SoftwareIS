import { ValidationError } from '../utils/errores.js';

export const ESTADOS_MARCABLES = ['RENDIDA', 'SIN_GASTOS'];

export const validarMarcarRendicion = (body) => {
  if(!ESTADOS_MARCABLES.includes(body.estado_rendicion)){
    throw new ValidationError(
      `estado_rendicion debe ser uno de: ${ESTADOS_MARCABLES.join(', ')}`,
      'estado_rendicion',
    );
  }
  return { estado_rendicion: body.estado_rendicion };
};