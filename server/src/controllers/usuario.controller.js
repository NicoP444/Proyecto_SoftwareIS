import { usuarioService } from '../services/usuario.service.js';

export const ListarUsuarios = async (req, res) => {
  try {
    const usuarios = await usuarioService.listarTodos();
    res.status(200).json(usuarios);
  } catch (error) {
    const msg = error.message || 'Error al listar usuarios.';
    res.status(500).json({ mensaje: msg, error: msg });
  }
};

export const CrearUsuario = async (req, res) => {
  try {
    const nuevo = await usuarioService.crear(req.body);
    res.status(201).json({ mensaje: 'Usuario creado exitosamente.', usuario: nuevo });
  } catch (error) {
    const msg = error.message || 'Error al crear el usuario.';
    res.status(400).json({ mensaje: msg, error: msg });
  }
};

export const ModificarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await usuarioService.modificar(id, req.body);
    res.status(200).json({ mensaje: 'Usuario modificado exitosamente.', usuario: actualizado });
  } catch (error) {
    const msg = error.message || 'Error al modificar el usuario.';
    res.status(400).json({ mensaje: msg, error: msg });
  }
};

export const ActualizarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await usuarioService.actualizarEstado(id, req.body);
    res.status(200).json({ mensaje: 'Estado del usuario actualizado.', usuario: actualizado });
  } catch (error) {
    const msg = error.message || 'Error al actualizar el estado del usuario.';
    res.status(400).json({ mensaje: msg, error: msg });
  }
};