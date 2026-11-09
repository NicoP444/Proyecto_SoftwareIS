import { pedir } from './http.js';

export const getHistorialEquipo = async (codigo) => {
  return await pedir(`/equipos-historial/${codigo}`);
};
