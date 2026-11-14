import { pedir } from './http.js';

export const verRentabilidad = (idEvento) => pedir(`/rentabilidad/evento/${idEvento}`);