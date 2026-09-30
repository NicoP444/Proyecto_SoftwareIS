import { iniciarSesion } from '../services/auth.service.js';

export async function login(req, res) {
  try {
    const { correo, contrasena } = req.body;

    const resultado = await iniciarSesion(correo, contrasena);

    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(401).json({ mensaje: error.message });
  }
}