import { pedir } from './http.js';

export function obtenerResumenMensual(anio, mes) {
  return pedir(`/resumen-mensual?anio=${anio}&mes=${mes}`);
}