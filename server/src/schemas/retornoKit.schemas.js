import { ValidationError } from '../utils/errores.js';

export const ESTADOS_RETORNO = ['OPERATIVO', 'DANO', 'PERDIDA', 'ROBO'];
const CODIGO_EQUIPO = /^[A-Za-z0-9_-]+$/;

const enteroPositivo = (valor, campo) => {
  const n = Number(valor);
  if (valor === undefined || valor === null || valor === '' || !Number.isInteger(n) || n <= 0) {
    throw new ValidationError(`El campo ${campo} debe ser un entero positivo`, campo);
  }
  return n;
};

export const validarRegistrarRetorno = (body) => {
  const { id_salida, id_jefe, revisiones } = body;

  const idSalidaValido = enteroPositivo(id_salida, 'id_salida');

  let idJefeValido = 1;
  if (id_jefe !== undefined && id_jefe !== null && id_jefe !== '') {
    idJefeValido = enteroPositivo(id_jefe, 'id_jefe');
  }

  if (!Array.isArray(revisiones) || revisiones.length === 0) {
    throw new ValidationError('Debe enviar al menos una revisión de equipo en revisiones', 'revisiones');
  }

  const revisionesLimpias = revisiones.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      throw new ValidationError(`El elemento #${idx + 1} de revisiones no es válido`, 'revisiones');
    }

    // 1. Código
    if (!item.codigo || String(item.codigo).trim() === '') {
      throw new ValidationError(`Falta el código del equipo en revisiones[${idx}]`, 'codigo');
    }
    const codigoLimpio = String(item.codigo).trim().toUpperCase();
    if (codigoLimpio.length > 30 || !CODIGO_EQUIPO.test(codigoLimpio)) {
      throw new ValidationError(`Código de equipo inválido en revisiones[${idx}]`, 'codigo');
    }

    // 2. Estado de retorno
    const estadoLimpio = String(item.estado_retorno || '').toUpperCase();
    if (!ESTADOS_RETORNO.includes(estadoLimpio)) {
      throw new ValidationError(
        `estado_retorno en ${codigoLimpio} debe ser uno de: ${ESTADOS_RETORNO.join(', ')}`,
        'estado_retorno'
      );
    }

    // 3. Observación opcional (máx 255)
    let obsLimpia = '';
    if (item.observacion !== undefined && item.observacion !== null) {
      obsLimpia = String(item.observacion).trim();
      if (obsLimpia.length > 255) {
        throw new ValidationError(
          `La observación de ${codigoLimpio} no puede superar los 255 caracteres`,
          'observacion'
        );
      }
    }

    // 4. Costo de reparación (obligatorio >= 0 si es DANO)
    let costoFinal = null;
    if (estadoLimpio === 'DANO') {
      if (item.costo_reparacion === undefined || item.costo_reparacion === null || item.costo_reparacion === '') {
        throw new ValidationError(
          `El costo de reparación es obligatorio para el equipo dañado ${codigoLimpio}`,
          'costo_reparacion'
        );
      }
      const costoNum = Number(item.costo_reparacion);
      if (!Number.isFinite(costoNum) || costoNum < 0) {
        throw new ValidationError(
          `El costo de reparación de ${codigoLimpio} debe ser mayor o igual a 0`,
          'costo_reparacion'
        );
      }
      costoFinal = Math.round(costoNum);
    } else if (item.costo_reparacion !== undefined && item.costo_reparacion !== null && item.costo_reparacion !== '') {
      const costoNum = Number(item.costo_reparacion);
      if (!Number.isFinite(costoNum) || costoNum < 0) {
        throw new ValidationError(
          `El costo de reparación de ${codigoLimpio} no puede ser negativo`,
          'costo_reparacion'
        );
      }
    }

    return {
      codigo: codigoLimpio,
      estado_retorno: estadoLimpio,
      observacion: obsLimpia,
      costo_reparacion: costoFinal,
    };
  });

  return {
    id_salida: idSalidaValido,
    id_jefe: idJefeValido,
    revisiones: revisionesLimpias,
  };
};