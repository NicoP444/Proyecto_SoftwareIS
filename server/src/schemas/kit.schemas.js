import { ValidationError } from '../utils/errores.js';

const NIVELES_VALIDOS = ['BASICO', 'ESTANDAR', 'ALTA_GAMA'];

const enteroPositivo = (valor, campo) => {
  const n = Number(valor);
  if (valor === undefined || valor === null || valor === '' || !Number.isInteger(n) || n <= 0) {
    throw new ValidationError(`El campo ${campo} debe ser un entero positivo`, campo);
  }
  return n;
};

export const validarCrearKit = (body) => {
  const { nombre, nivel, recargo_pct, id_jefe, equipos } = body;

  if (typeof nombre !== 'string' || nombre.trim().length === 0) {
    throw new ValidationError('El nombre del kit es obligatorio y debe ser texto', 'nombre');
  }
  const nombreLimpio = nombre.trim();
  if (nombreLimpio.length > 60) {
    throw new ValidationError('El nombre del kit no puede superar los 60 caracteres', 'nombre');
  }

  if (typeof nivel !== 'string' || !NIVELES_VALIDOS.includes(nivel.trim().toUpperCase())) {
    throw new ValidationError('El nivel debe ser BASICO, ESTANDAR o ALTA_GAMA', 'nivel');
  }
  const nivelValido = nivel.trim().toUpperCase();

  let recargoValido = 0;
  if (recargo_pct !== undefined && recargo_pct !== null && recargo_pct !== '') {
    const recargoNum = Number(recargo_pct);
    if (Number.isNaN(recargoNum) || recargoNum < 0 || recargoNum > 999.99) {
      throw new ValidationError('El recargo porcentual debe ser un número entre 0 y 999.99', 'recargo_pct');
    }
    recargoValido = recargoNum;
  }

  let idJefeValido = undefined;
  if (id_jefe !== undefined && id_jefe !== null && id_jefe !== '') {
    idJefeValido = enteroPositivo(id_jefe, 'id_jefe');
  }

  if (!Array.isArray(equipos) || equipos.length < 4) {
    throw new ValidationError(
      'Para crear un kit debes seleccionar al menos 4 equipos (cámara, trípode, micrófono y switch de video)',
      'equipos'
    );
  }

  const codigosValidos = equipos.map((codigo) => {
    if (typeof codigo !== 'string' || codigo.trim().length === 0) {
      throw new ValidationError('Cada código de equipo debe ser un texto válido', 'equipos');
    }
    return codigo.trim();
  });
  const codigosUnicos = [...new Set(codigosValidos)];

  if (codigosUnicos.length < 4) {
    throw new ValidationError(
      'No puedes repetir el mismo equipo; deben ser al menos 4 equipos distintos',
      'equipos'
    );
  }

  return {
    nombre: nombreLimpio,
    nivel: nivelValido,
    recargo_pct: recargoValido,
    id_jefe: idJefeValido,
    equipos: codigosUnicos,
  };
};

export const validarModificarKit = (body) => {
  const { nombre, nivel, recargo_pct, id_jefe, equipos } = body;
  let datosValidados = {};

  if (nombre !== undefined && nombre !== null) {
    if (typeof nombre !== 'string' || nombre.trim().length === 0) {
      throw new ValidationError('El nombre del kit debe ser texto válido', 'nombre');
    }
    datosValidados.nombre = nombre.trim();
  }

  if (nivel !== undefined && nivel !== null) {
    if (typeof nivel !== 'string' || !NIVELES_VALIDOS.includes(nivel.trim().toUpperCase())) {
      throw new ValidationError('El nivel debe ser BASICO, ESTANDAR o ALTA_GAMA', 'nivel');
    }
    datosValidados.nivel = nivel.trim().toUpperCase();
  }

  if (recargo_pct !== undefined && recargo_pct !== null && recargo_pct !== '') {
    const recargoNum = Number(recargo_pct);
    if (Number.isNaN(recargoNum) || recargoNum < 0 || recargoNum > 999.99) {
      throw new ValidationError('El recargo porcentual debe ser un número entre 0 y 999.99', 'recargo_pct');
    }
    datosValidados.recargo_pct = recargoNum;
  }

  if (id_jefe !== undefined && id_jefe !== null && id_jefe !== '') {
    datosValidados.id_jefe = enteroPositivo(id_jefe, 'id_jefe');
  }

  if (equipos !== undefined && equipos !== null) {
    if (!Array.isArray(equipos) || equipos.length === 0) {
      throw new ValidationError('El kit debe mantener al menos un equipo', 'equipos');
    }
    const codigosValidos = equipos.map((codigo) => {
      if (typeof codigo !== 'string' || codigo.trim().length === 0) {
        throw new ValidationError('Cada código de equipo debe ser un texto válido', 'equipos');
      }
      return codigo.trim();
    });
    const codigosUnicos = [...new Set(codigosValidos)];
    datosValidados.equipos = codigosUnicos;
  }

  return datosValidados;
};