import { pedir } from './http.js';

export function obtenerRegistrosMesCerrado(anio, mes) {
  return pedir(`/corregir-mes/registros?anio=${anio}&mes=${mes}`);
}

export function corregirMontoMesCerrado(anio, mes, payload) {
  return pedir(`/corregir-mes/corregir?anio=${anio}&mes=${mes}`, {
    method: 'PATCH',
    body: {
      anio: Number(anio),
      mes: Number(mes),
      ...payload,
    },
  });
}