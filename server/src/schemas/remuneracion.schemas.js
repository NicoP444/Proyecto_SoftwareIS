import { ValidationError } from '../utils/errores.js';

// Tope del porcentaje que puede recibir UN trabajador por evento.
// Para cambiarlo (30, 40...), se modifica solo este número.
export const TOPE_PORCENTAJE = 20;

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

// Porcentaje de 0 al tope, con hasta dos decimales (acepta "12.5" o "12,5")
const porcentaje = (valor, campo) => {
  const t = String(valor ?? '').trim().replace(',', '.');
  if(!/^\d{1,3}(\.\d+)?$/.test(t)){
    throw new ValidationError(
      `El porcentaje debe ser un número par entre 0 y ${TOPE_PORCENTAJE}, sin decimales (ej: 2, 4, 6...)`,
      campo,
    );
  }
  const n = Number(t);
  if(n > TOPE_PORCENTAJE){
    throw new ValidationError(`El porcentaje por trabajador no puede superar el ${TOPE_PORCENTAJE}%`, campo);
  }
  if(!Number.isInteger(n) || n % 2 !== 0){
    throw new ValidationError('El porcentaje debe ser un número par, sin decimales (ej: 2, 4, 6...)', campo);
  }
  return n;
};

// RF-P7-05
export const validarDefinirPorcentaje = (body) => ({
  id_dueno: entero(body.id_dueno, 'id_dueno'),
  porcentaje: porcentaje(body.porcentaje, 'porcentaje'),
  motivo: texto(body.motivo, 'motivo', 255),
});