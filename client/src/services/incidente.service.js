import { pedir } from './http.js';

export function registrarIncidente(datos) {
  return pedir('/incidentes', { method: 'POST', body: datos });
}

export function obtenerIncidentes() {
  return pedir('/incidentes');
}

export function obtenerEquipos() {
  return pedir('/equipos');
}

export function obtenerEventos() {
  return pedir('/eventos');
}

export function obtenerTrabajadores() {
  return pedir('/trabajadores');
}