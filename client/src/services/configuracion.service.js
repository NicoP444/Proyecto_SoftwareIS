import { pedir, obtenerUsuario } from './http.js';

// El back (validarDueno) pide id_dueno: es el id del usuario que inició sesión
const idDueno = () => obtenerUsuario()?.id;

// RF-P3-02: margen de traslado actual (en minutos)
export const obtenerMargenTraslado = () =>
  pedir(`/configuracion/margen-traslado?id_dueno=${idDueno()}`);

export const guardarMargenTraslado = (minutos) =>
  pedir('/configuracion/margen-traslado', {
    method: 'PUT',
    body: { id_dueno: idDueno(), margen_traslado_min: minutos },
  });