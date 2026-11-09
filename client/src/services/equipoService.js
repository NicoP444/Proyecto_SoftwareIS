import { pedir } from './http.js';

// Obtener la lista completa de equipos en inventario
export async function obtenerEquipos() {
  return pedir('/equipos');
}

// Registrar un nuevo equipo 
export async function registrarEquipo(datosEquipo) {
  return pedir('/equipos', {
    method: 'POST',
    body: datosEquipo,
  });
}

// Modificar equipo 
export async function actualizarEquipo(codigo, datosEquipo) {
  return pedir(`/equipos/${codigo}`, {
    method: 'PUT',
    body: datosEquipo,
  });
}

// Dar de baja equipo indicando motivo 
export async function darDeBajaEquipo(codigo, motivo) {
  return pedir(`/equipos/${codigo}/baja`, {
    method: 'PATCH',
    body: { motivo },
  });
}

// Eliminar equipo definitivamente solo si no tiene historial de uso 
export async function eliminarEquipo(codigo) {
  return pedir(`/equipos/${codigo}`, {
    method: 'DELETE',
  });
}