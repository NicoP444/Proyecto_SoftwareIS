import { pedir } from './http.js';

export const listarPagos = (idEvento) => pedir(`/pagos-remuneracion/evento/${idEvento}`);

// El id es el id_asignacion
export const registrarPago = (idAsignacion, body) =>
  pedir(`/pagos-remuneracion/${idAsignacion}`, { method: 'POST', body });