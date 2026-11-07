import { ValidationError } from '../utils/errores.js';

const entero = (valor, campo) => {
  const n = Number(valor);
  if(valor === '' || valor === null || valor === undefined || !Number.isInteger(n) || n <= 0){
    throw new ValidationError(`El campo ${campo} no es válido`, campo);
  }
  return n;
};

const texto = (valor, campo, max) => {
  if(valor === undefined || valor === null) return null;
  const t = String(valor).trim();
  if(t === '') return null;
  if(t.length > max){
    throw new ValidationError(`El campo ${campo} no puede superar ${max} caracteres`, campo);
  }
  return t;
};

// Porcentaje de 0 a 100 con hasta dos decimales (acepta "12.5" o "12,5")
const porcentaje = (valor, campo) => {
  const t = String(valor ?? '').trim().replace(',', '.');
  if(!/^\d{1,3}(\.\d{1,2})?$/.test(t)){
    throw new ValidationError('El porcentaje debe ser un número entre 0 y 100 con hasta dos decimales', campo);
  }
  const n = Number(t);
  if(n > 100){
    throw new ValidationError('El porcentaje no puede superar 100', campo);
  }
  return n;
};

// RF-P7-05
export const validarDefinirPorcentaje = (body) => ({
  id_dueno: entero(body.id_dueno, 'id_dueno'),
  porcentaje: porcentaje(body.porcentaje, 'porcentaje'),
  motivo: texto(body.motivo, 'motivo', 255),
});