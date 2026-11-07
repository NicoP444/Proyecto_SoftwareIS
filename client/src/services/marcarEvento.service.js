import { pedir } from './http.js'; // o './api.js' según corresponda en tu carpeta services

// Consultar eventos confirmados listos para marcar
export function listarEventosConfirmados() {
  return pedir('/eventos-realizados/confirmados');
}

// Marcar un evento como realizado (RF-P7-01)
export function marcarEventoComoRealizado(idEvento) {
  return pedir(`/eventos-realizados/${idEvento}/realizado`, {
    method: 'PATCH',
  });
}