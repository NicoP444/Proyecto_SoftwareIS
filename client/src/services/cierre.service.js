import { pedir } from './http.js';

export const revisarCierre = (idEvento) => pedir(`/cierre-jornada/evento/${idEvento}`);

export const cerrarJornada = (idEvento, body) =>
  pedir(`/cierre-jornada/evento/${idEvento}`, { method: 'POST', body });