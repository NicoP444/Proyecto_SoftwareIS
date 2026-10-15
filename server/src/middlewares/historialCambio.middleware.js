import { validarDueno, camposObligatorios } from './validate.middleware.js';

export const verListadoHistorialCambioMiddleware = [validarDueno];

export const crearHistorialCambioMiddleware = [
  validarDueno,
  camposObligatorios('tabla_afectada', 'dato'),
];