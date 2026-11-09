import { pedir } from './http.js';

export const obtenerKitsEnTerreno = async () => {
  return await pedir('/retornos-kits/en-terreno');
};

export const registrarRetornoKit = async (datosRetorno) => {
  return await pedir('/retornos-kits', {
    method: 'POST',
    body: datosRetorno,
  });
};