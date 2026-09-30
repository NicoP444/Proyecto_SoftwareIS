// client/src/services/auspiciadorService.js
import { pedir } from './http.js';

export async function registrarAuspiciador(datosAuspiciador) {
  return pedir('/auspiciadores', {
    method: 'POST',
    body: datosAuspiciador
  });
}
