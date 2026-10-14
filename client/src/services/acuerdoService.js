import { pedir } from './http.js';

// Obtener la lista completa de acuerdos para la tabla principal
export async function obtenerAcuerdos() {
  return pedir('/acuerdos');
}

// Registrar un nuevo acuerdo vinculado a auspiciador y evento (RF-P4-02)
export async function registrarAcuerdo(datosAcuerdo) {
  return pedir('/acuerdos', {
    method: 'POST',
    body: datosAcuerdo,
  });
}