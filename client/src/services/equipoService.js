import { pedir } from './http.js';

// Obtener la lista completa de equipos en inventario
export async function obtenerEquipos() {
  return pedir('/equipos');
}

// Registrar un nuevo equipo (RF-P5-01)
export async function registrarEquipo(datosEquipo) {
  return pedir('/equipos', {
    method: 'POST',
    body: datosEquipo,
  });
}