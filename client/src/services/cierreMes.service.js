import { pedir } from './http.js';

export function validarPreCierreMes(anio, mes) {
  return pedir(`/cierre-mes/validar?anio=${anio}&mes=${mes}`);
}

export function cerrarMesContable(anio, mes) {
  return pedir(`/cierre-mes/cerrar?anio=${anio}&mes=${mes}`, {
    method: 'POST',
    body: { anio: Number(anio), mes: Number(mes) },
  });
}