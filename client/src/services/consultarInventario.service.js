import { pedir } from './http.js';

export function consultarInventario() {
  return pedir('/inventario');
}