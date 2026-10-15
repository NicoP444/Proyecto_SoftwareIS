import { validarId, validarBody, camposObligatorios, validarDueno } from './validate.middleware.js';

export const crearDisponibilidadMiddleware = [
  validarId,
  validarBody,
  camposObligatorios('id_dueno', 'fecha_inicio', 'fecha_termino', 'hora_inicio', 'hora_termino'),
  validarDueno,
];


export const listarDisponibilidadMiddleware = [
  validarId,
  validarDueno,
];