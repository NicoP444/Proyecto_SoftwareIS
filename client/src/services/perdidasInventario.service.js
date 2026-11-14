import { pedir } from './http.js';

export function listarPerdidasInventario(anio, mes) {
  return pedir(`/perdidas-inventario?anio=${anio}&mes=${mes}`);
}