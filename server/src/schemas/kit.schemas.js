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

  // 1. Validar nombre
  if (typeof nombre !== 'string' || nombre.trim().length === 0) {
    throw new ValidationError('El nombre del kit es obligatorio y debe ser texto', 'nombre');
  }
  const nombreLimpio = nombre.trim();
  if (nombreLimpio.length > 60) {
    throw new ValidationError('El nombre del kit no puede superar los 60 caracteres', 'nombre');
  }

  // 2. Validar nivel (BASICO, ESTANDAR, ALTA_GAMA)
  if (typeof nivel !== 'string' || !NIVELES_VALIDOS.includes(nivel.trim().toUpperCase())) {
    throw new ValidationError(
      'El nivel debe ser BASICO, ESTANDAR o ALTA_GAMA',
      'nivel'
    );
  }
  const nivelValido = nivel.trim().toUpperCase();

  // 3. Validar recargo_pct (opcional, por defecto 0)
  let recargoValido = 0;
  if (recargo_pct !== undefined && recargo_pct !== null && recargo_pct !== '') {
    const recargoNum = Number(recargo_pct);
    if (Number.isNaN(recargoNum) || recargoNum < 0 || recargoNum > 999.99) {
      throw new ValidationError(
        'El recargo porcentual debe ser un número entre 0 y 999.99',
        'recargo_pct'
      );
    }
    recargoValido = recargoNum;
  }

  // 4. Validar id_jefe (opcional, si viene debe ser entero positivo)
  let idJefeValido = undefined;
  if (id_jefe !== undefined && id_jefe !== null && id_jefe !== '') {
    idJefeValido = enteroPositivo(id_jefe, 'id_jefe');
  }

  // 5. Validar arreglo de equipos (mínimo 4 por requisito)
  if (!Array.isArray(equipos) || equipos.length < 4) {
    throw new ValidationError(
      'Debes seleccionar al menos 4 equipos (cámara, trípode, micrófono y switch de video)',
      'equipos'
    );
  }

  const equiposValidos = equipos.map((id) => enteroPositivo(id, 'equipos'));
  const equiposUnicos = [...new Set(equiposValidos)];

  if (equiposUnicos.length < 4) {
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
    equipos: equiposUnicos,
  };
};