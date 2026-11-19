import { pedir } from './http.js';

export async function obtenerUsuarios(idDueno) {
  return pedir('/usuarios');
}

export async function crearUsuario(datos) {
  return pedir('/usuarios', {
    method: 'POST',
    body: datos,
  });
}

export async function modificarUsuario(id, datos) {
  return pedir(`/usuarios/${id}`, {
    method: 'PUT',
    body: datos,
  });
}

export async function cambiarEstadoUsuario(id, rol, estado) {
  return pedir(`/usuarios/${id}/estado`, {
    method: 'PUT',
    body: { rol, estado },
  });
}