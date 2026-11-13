import { ValidationError } from '../utils/errores.js';

export const TIPOS_INCIDENTE = ['DANO', 'PERDIDA', 'ROBO'];
const CODIGO_EQUIPO = /^[A-Za-z0-9_-]+$/;
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const enteroPositivoOpcional = (valor, campo) => {
  if (valor === undefined || valor === null || valor === '') return null;
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ValidationError(`El campo ${campo} debe ser un entero positivo`, campo);
  }
  return n;
};

export const validarIdEventoParam = (id_evento) => {
  const n = Number(id_evento);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ValidationError('El parámetro id_evento debe ser un entero positivo', 'id_evento');
  }
  return n;
};

export const validarCrearIncidente = (body) => {
  const { codigo, tipo, descripcion, costo_reparacion, id_evento, id_trabajador, fecha } = body;

  // 1. Código del equipo
  if (codigo === undefined || codigo === null || String(codigo).trim() === '') {
    throw new ValidationError('El código del equipo es obligatorio', 'codigo');
  }
  const codigoLimpio = String(codigo).trim().toUpperCase();
  if (codigoLimpio.length > 30) {
    throw new ValidationError('El código del equipo no puede superar los 30 caracteres', 'codigo');
  }
  if (!CODIGO_EQUIPO.test(codigoLimpio)) {
    throw new ValidationError(
      'El código del equipo solo puede contener letras, números, guiones (-) o guiones bajos (_)',
      'codigo'
    );
  }

  // 2. Tipo de incidente
  if (!tipo || !TIPOS_INCIDENTE.includes(String(tipo).toUpperCase())) {
    throw new ValidationError(
      `El tipo de incidente debe ser uno de: ${TIPOS_INCIDENTE.join(', ')}`,
      'tipo'
    );
  }
  const tipoLimpio = String(tipo).toUpperCase();

  // 3. Descripción
  if (descripcion === undefined || descripcion === null || String(descripcion).trim() === '') {
    throw new ValidationError('La descripción del incidente es obligatoria', 'descripcion');
  }
  const descLimpia = String(descripcion).trim();
  if (descLimpia.length > 255) {
    throw new ValidationError('La descripción no puede superar los 255 caracteres', 'descripcion');
  }

  // 4. Costo de reparación (obligatorio y >= 0 cuando es DANO)
  let costoFinal = undefined;
  if (tipoLimpio === 'DANO') {
    if (costo_reparacion === undefined || costo_reparacion === null || costo_reparacion === '') {
      throw new ValidationError('El costo de reparación es obligatorio cuando el tipo es DANO', 'costo_reparacion');
    }
    const costoNum = Number(costo_reparacion);
    if (!Number.isFinite(costoNum) || costoNum < 0) {
      throw new ValidationError('El costo de reparación debe ser un número mayor o igual a 0', 'costo_reparacion');
    }
    costoFinal = Math.round(costoNum);
  } else if (costo_reparacion !== undefined && costo_reparacion !== null && costo_reparacion !== '') {
    const costoNum = Number(costo_reparacion);
    if (!Number.isFinite(costoNum) || costoNum < 0) {
      throw new ValidationError('El costo de reparación no puede ser negativo', 'costo_reparacion');
    }
  }

  // 5. Fecha opcional
  if (fecha !== undefined && fecha !== null && fecha !== '') {
    if (!FECHA_REGEX.test(String(fecha))) {
      throw new ValidationError('La fecha debe tener formato AAAA-MM-DD', 'fecha');
    }
    const parsed = new Date(`${fecha}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== String(fecha)) {
      throw new ValidationError('La fecha ingresada no es válida', 'fecha');
    }
  }

  return {
    ...body,
    codigo: codigoLimpio,
    tipo: tipoLimpio,
    descripcion: descLimpia,
    costo_reparacion: costoFinal,
    id_evento: enteroPositivoOpcional(id_evento, 'id_evento'),
    id_trabajador: enteroPositivoOpcional(id_trabajador, 'id_trabajador'),
  };
};