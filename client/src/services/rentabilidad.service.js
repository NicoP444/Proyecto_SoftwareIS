import { pedir } from './http.js';

export const verRentabilidad = (idEvento) => pedir(`/rentabilidad/evento/${idEvento}`);

// RF-P7-12
export const listarRentabilidadMes = (anio, mes) => pedir(`/rentabilidad/mes?anio=${anio}&mes=${mes}`);
export const verMovimientos = (idEvento) => pedir(`/rentabilidad/evento/${idEvento}/movimientos`);