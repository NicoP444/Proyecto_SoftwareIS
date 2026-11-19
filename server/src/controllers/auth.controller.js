import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.js';
import { iniciarSesion, cerrarSesion } from '../services/auth.service.js';

export async function login(req, res) {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ mensaje: 'Debe ingresar correo y contraseña' });
    }

    const resultado = await iniciarSesion(correo, contrasena);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(401).json({ mensaje: error.message });
  }
}

export async function logout(req, res) {
  try {
    let idSesion = req.usuario?.id_sesion || req.body?.id_sesion || null;

    // Si no viene en req.usuario, intentamos leerlo del token Bearer
    if (!idSesion && req.headers.authorization?.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        idSesion = decoded.id_sesion;
      } catch {
        // Si el token ya expiró, igual permitimos responder 200 al cierre de sesión
      }
    }

    const resultado = await cerrarSesion(idSesion);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al cerrar sesión', detalle: error.message });
  }
}