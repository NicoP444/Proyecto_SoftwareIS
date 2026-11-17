import { pedir } from './http.js';

export const obtenerUsuarios = async (idDueno = 1) => {
  return await pedir(`/usuarios?id_dueno=${idDueno}`);
};

export const crearUsuario = async (datosUsuario) => {
  return await pedir('/usuarios', {
    method: 'POST',
    body: datosUsuario,
  });
};

export const cambiarEstadoUsuario = async (id, rol, estado) => {
  return await pedir(`/usuarios/${id}/estado`, {
    method: 'PUT',
    body: { rol, estado },
  });
};