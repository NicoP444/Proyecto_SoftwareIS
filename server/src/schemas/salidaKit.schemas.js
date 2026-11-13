import { ValidationError } from '../utils/errores.js';

const enteroPositivo = (valor, campo) => {
  const n = Number(valor);
  if (valor === undefined || valor === null || valor === '' || !Number.isInteger(n) || n <= 0) {
    throw new ValidationError(`El campo ${campo} debe ser un entero positivo`, campo);
  }
  return n;
};

export const validarIdEventoSalida = (id_evento) => {
  return enteroPositivo(id_evento, 'id_evento');
};

export const validarRegistrarSalidaKit = (body) => {
  const { id_reserva, id_asignacion, id_jefe, fecha_hora_salida } = body;

  const idReservaValido = enteroPositivo(id_reserva, 'id_reserva');
  const idAsignacionValido = enteroPositivo(id_asignacion, 'id_asignacion');

  let idJefeValido = 1;
  if (id_jefe !== undefined && id_jefe !== null && id_jefe !== '') {
    idJefeValido = enteroPositivo(id_jefe, 'id_jefe');
  }

  let fechaValida = undefined;
  if (fecha_hora_salida !== undefined && fecha_hora_salida !== null && fecha_hora_salida !== '') {
    const d = new Date(fecha_hora_salida);
    if (Number.isNaN(d.getTime())) {
      throw new ValidationError('La fecha_hora_salida no tiene un formato de fecha/hora válido', 'fecha_hora_salida');
    }
    fechaValida = d;
  }

  return {
    id_reserva: idReservaValido,
    id_asignacion: idAsignacionValido,
    id_jefe: idJefeValido,
    fecha_hora_salida: fechaValida,
  };
};