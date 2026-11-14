import { pedir } from './http.js';

export function obtenerResumenInventario(anio, mes) {
  return pedir(`/resumen-inventario?anio=${anio}&mes=${mes}`);
}