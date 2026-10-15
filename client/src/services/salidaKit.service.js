import { pedir } from './http.js';

// Llama a tu propio endpoint de eventos
export const obtenerEventos = async () => {
  return await pedir('/salidas-kits/eventos');
};

// Obtener los kits reservados y personal asignado para un evento
export const obtenerKitsPorEvento = async (idEvento) => {
  return await pedir(`/salidas-kits/evento/${idEvento}`);
};

// Registrar la salida del kit
export const registrarSalidaKit = async (datosSalida) => {
  return await pedir('/salidas-kits', {
    method: 'POST',
    body: datosSalida,
  });
};