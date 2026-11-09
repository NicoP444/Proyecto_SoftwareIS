import { pedir } from './http.js';

// Porcentaje y monto de cada trabajador del evento, y lo que queda para la empresa
export const listarRemuneraciones = (idEvento) => pedir(`/remuneraciones/evento/${idEvento}`);

// RF-P7-05: el id es el id_asignacion
export const definirPorcentaje = (idAsignacion, body) =>
  pedir(`/remuneraciones/${idAsignacion}`, { method: 'PUT', body });