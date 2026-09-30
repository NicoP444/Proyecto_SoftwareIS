import { pedir } from './http.js';

export function listarTrabajadores(id_dueno) {
  return pedir('/trabajadores?id_dueno=' + id_dueno);
}

export function crearTrabajador(datos) {
  return pedir('/trabajadores', { method: 'POST', body: datos });
}

export function actualizarTrabajador(id, datos) {
  return pedir('/trabajadores/' + id, { method: 'PUT', body: datos });
}