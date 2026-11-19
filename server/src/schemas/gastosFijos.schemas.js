import { ValidationError } from '../utils/errores.js';

const TIENE_LETRAS_REGEX = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/;

export const validarPeriodoQuery = (query) => {
  const ahora = new Date();
  const anioNum = query.anio !== undefined && query.anio !== '' ? Number(query.anio) : ahora.getFullYear();
  const mesNum = query.mes !== undefined && query.mes !== '' ? Number(query.mes) : ahora.getMonth() + 1;

  if (!Number.isInteger(anioNum) || anioNum < 2000 || anioNum > 2100) {
    throw new ValidationError('El año debe ser un entero válido entre 2000 y 2100', 'anio');
  }
  if (!Number.isInteger(mesNum) || mesNum < 1 || mesNum > 12) {
    throw new ValidationError('El mes debe ser un entero entre 1 y 12', 'mes');
  }

  return { anio: anioNum, mes: mesNum };
};

export const validarCrearGastoFijo = (body) => {
  const { anio, mes, descripcion, monto, evidencia, id_contador } = body;

  const anioNum = Number(anio);
  if (anio === undefined || anio === null || anio === '' || !Number.isInteger(anioNum) || anioNum < 2000 || anioNum > 2100) {
    throw new ValidationError('El año es obligatorio y debe estar entre 2000 y 2100', 'anio');
  }

  const mesNum = Number(mes);
  if (mes === undefined || mes === null || mes === '' || !Number.isInteger(mesNum) || mesNum < 1 || mesNum > 12) {
    throw new ValidationError('El mes es obligatorio y debe ser un número entre 1 y 12', 'mes');
  }

  const ahora = new Date();
  const anioActual = ahora.getFullYear();
  const mesActual = ahora.getMonth() + 1;
  if (anioNum !== anioActual || mesNum !== mesActual) {
    throw new ValidationError(
      `Solo se pueden registrar gastos fijos en el período actual (${String(mesActual).padStart(2, '0')}/${anioActual})`,
      'mes'
    );
  }

  if (descripcion === undefined || descripcion === null || String(descripcion).trim() === '') {
    throw new ValidationError('La descripción del gasto fijo es obligatoria', 'descripcion');
  }
  const descLimpia = String(descripcion).trim();
  if (descLimpia.length > 255) {
    throw new ValidationError('La descripción no puede superar los 255 caracteres', 'descripcion');
  }
  if (!TIENE_LETRAS_REGEX.test(descLimpia)) {
    throw new ValidationError(
      'La descripción del gasto fijo debe incluir texto explicativo (no puede contener solo números)',
      'descripcion'
    );
  }

  const montoNum = Number(monto);
  if (monto === undefined || monto === null || monto === '' || !Number.isInteger(montoNum) || montoNum <= 0) {
    throw new ValidationError('El monto del gasto fijo debe ser un número entero mayor a 0', 'monto');
  }
  if (montoNum > 1000000000) {
    throw new ValidationError('El monto del gasto fijo no puede superar $1.000.000.000', 'monto');
  }

  let evidenciaLimpia = null;
  if (evidencia !== undefined && evidencia !== null && String(evidencia).trim() !== '') {
    evidenciaLimpia = String(evidencia).trim();
    if (evidenciaLimpia.length > 255) {
      throw new ValidationError('La referencia o URL de evidencia no puede superar los 255 caracteres', 'evidencia');
    }
  }

  let contadorNum = undefined;
  if (id_contador !== undefined && id_contador !== null && id_contador !== '') {
    contadorNum = Number(id_contador);
    if (!Number.isInteger(contadorNum) || contadorNum <= 0) {
      throw new ValidationError('El id_contador debe ser un entero positivo', 'id_contador');
    }
  }

  return {
    anio: anioNum,
    mes: mesNum,
    descripcion: descLimpia,
    monto: montoNum,
    evidencia: evidenciaLimpia,
    id_contador: contadorNum,
  };
};

export const validarActualizarGastoFijo = (body) => {
  const { descripcion, monto } = body;

  if (descripcion === undefined || descripcion === null || String(descripcion).trim() === '') {
    throw new ValidationError('La descripción del gasto fijo es obligatoria', 'descripcion');
  }
  const descLimpia = String(descripcion).trim();
  if (descLimpia.length > 255) {
    throw new ValidationError('La descripción no puede superar los 255 caracteres', 'descripcion');
  }
  if (!TIENE_LETRAS_REGEX.test(descLimpia)) {
    throw new ValidationError(
      'La descripción del gasto fijo debe incluir texto explicativo (no puede contener solo números)',
      'descripcion'
    );
  }

  const montoNum = Number(monto);
  if (monto === undefined || monto === null || monto === '' || !Number.isInteger(montoNum) || montoNum <= 0) {
    throw new ValidationError('El monto del gasto fijo debe ser un número entero mayor a 0', 'monto');
  }
  if (montoNum > 1000000000) {
    throw new ValidationError('El monto del gasto fijo no puede superar $1.000.000.000', 'monto');
  }

  return {
    descripcion: descLimpia,
    monto: montoNum,
  };
};