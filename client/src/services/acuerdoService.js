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

// Registrar el cumplimiento o pago del aporte (RF-P4-04)
export async function registrarCumplimiento(idAcuerdo, datosCumplimiento) {
  return pedir(`/acuerdos/${idAcuerdo}/cumplimiento`, {
    method: 'PUT',
    body: datosCumplimiento,
  });
}

// Declarar aporte incobrable (RF-P4-06)
export async function declararIncobrable(idAcuerdo, motivo_incobrable) {
  return pedir(`/acuerdos/${idAcuerdo}/incobrable`, {
    method: 'PATCH',
    body: { motivo_incobrable },
  });
}

// Modificar datos de un acuerdo
export async function modificarAcuerdo(idAcuerdo, datosAcuerdo) {
  return pedir(`/acuerdos/${idAcuerdo}`, {
    method: 'PUT',
    body: datosAcuerdo,
  });
}

// Eliminar un acuerdo
export async function eliminarAcuerdo(idAcuerdo) {
  return pedir(`/acuerdos/${idAcuerdo}`, {
    method: 'DELETE',
  });
}