import { ValidationError } from '../utils/errores.js';

export const validarPago = (body) => {
  const monto = Number(body.monto);
  if(body.monto === '' || body.monto === null || body.monto === undefined || !Number.isInteger(monto) || monto <= 0){
    throw new ValidationError('El monto debe ser un número entero mayor a 0', 'monto');
  }

  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(body.fecha))){
    throw new ValidationError('La fecha debe tener formato AAAA-MM-DD', 'fecha');
  }
  const fecha = new Date(`${body.fecha}T00:00:00.000Z`);
  if(Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== body.fecha){
    throw new ValidationError('La fecha no es válida', 'fecha');
  }

  const medio_pago = String(body.medio_pago ?? '').trim();
  if(!medio_pago) throw new ValidationError('El medio de pago es obligatorio', 'medio_pago');
  if(medio_pago.length > 20) throw new ValidationError('El medio de pago no puede superar 20 caracteres', 'medio_pago');

  return {
    id_contador: Number(body.id_contador), // ya validado por el middleware validarContador
    fecha,
    monto,
    medio_pago,
    confirmar: body.confirmar === true || body.confirmar === 'true',
  };
};