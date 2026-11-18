import * as UsuarioServicio from '../services/usuario.service.js';
import { manejarError } from '../utils/errores.js';

export const ListarUsuarios = async (req, res) => {
  try {
    const lista = await UsuarioServicio.ListarTodosLosUsuarios();
    res.json(lista);
  } catch (error) {
    manejarError(res, error);
  }
};

export const CrearUsuario = async (req, res) => {
  try {
    const nuevoUsuario = await UsuarioServicio.CrearUsuarioGlobal(req.body);
    res.json(nuevoUsuario);
  } catch (error) {
    manejarError(res, error);
  }
};

export const ActualizarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol, estado } = req.body;
    const usuarioActualizado = await UsuarioServicio.ActualizarEstadoUsuario(id, rol, { estado });
    res.json(usuarioActualizado);
  } catch (error) {
    manejarError(res, error);
  }
};