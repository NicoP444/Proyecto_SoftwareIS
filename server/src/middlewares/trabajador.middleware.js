import { validarId, validarBody, camposObligatorios, validarDueno } from './validate.middleware.js';

export const validarCrearTrabajador = [
  validarBody,
  camposObligatorios('nombre', 'id_dueno'),
  validarDueno,
];

export const validarActualizarTrabajador = [validarId, validarBody];