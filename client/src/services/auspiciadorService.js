import { pedir } from './http.js';

export async function registrarAuspiciador(datosAuspiciador) {
  return pedir('/auspiciadores', {
    method: 'POST',
    body: datosAuspiciador
  });
}

export async function obtenerAuspiciadores() {
  return pedir('/auspiciadores');
}

// 3. Modificar auspiciador (PUT /api/auspiciadores/:id)
export async function modificarAuspiciador(id, datosAuspiciador) {
  return pedir(`/auspiciadores/${id}`, {
    method: 'PUT',
    body: datosAuspiciador
  });
}

// 4. Eliminar auspiciador (DELETE /api/auspiciadores/:id)
export async function eliminarAuspiciador(id) {
  return pedir(`/auspiciadores/${id}`, {
    method: 'DELETE'
  });
}