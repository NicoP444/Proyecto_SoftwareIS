import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.js';

// El token trae { id, correo, rol }: según el rol, ese id es de dueño, contador o jefe técnico
const CAMPO_ID = { DUENO: 'id_dueno', CONTADOR: 'id_contador', JEFE_TECNICO: 'id_jefe' };

// Exige sesión: lee el token del header "Authorization: Bearer <token>" y lo verifica.
// Si es válido deja al usuario en req.user y sigue; si no, responde 401.
export const autenticar = (req, res, next) => {
  const [tipo, token] = String(req.headers.authorization ?? '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ mensaje: 'Debes iniciar sesión' });
  }

  try {
    const datos = jwt.verify(token, JWT_SECRET);
    req.user = { ...datos, [CAMPO_ID[datos.rol]]: datos.id };
    req.usuario = req.user; // algunos controladores antiguos leen req.usuario
    next();
  } catch {
    return res.status(401).json({ mensaje: 'Tu sesión expiró. Vuelve a iniciar sesión' });
  }
};

// RF-T-04: deja pasar solo a los roles indicados; a los demás los rechaza con 403
export const permitirRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.rol)) {
    return res.status(403).json({ mensaje: 'Permiso insuficiente para realizar esta acción' });
  }
  next();
};