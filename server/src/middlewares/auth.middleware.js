import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { JWT_SECRET } from '../config/jwt.js';

// El token trae { id, correo, rol, id_sesion }: según el rol, ese id es de dueño, contador o jefe técnico
const CAMPO_ID = { DUENO: 'id_dueno', CONTADOR: 'id_contador', JEFE_TECNICO: 'id_jefe' };

// Exige sesión: lee el token del header "Authorization: Bearer <token>" y lo verifica.
// Si es válido deja al usuario en req.user y req.usuario y sigue; si no, responde 401.
export const autenticar = async (req, res, next) => {
  const [tipo, token] = String(req.headers.authorization ?? '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ mensaje: 'Debes iniciar sesión' });
  }

  try {
    const datos = jwt.verify(token, JWT_SECRET);

    // Si el token trae id_sesion, verificamos que no haya cerrado sesión (RF-T-02)
    if (datos.id_sesion) {
      const sesion = await prisma.sesion.findUnique({
        where: { id_sesion: Number(datos.id_sesion) },
      });

      if (!sesion || sesion.fecha_hora_cierre) {
        return res.status(401).json({ mensaje: 'La sesión ya fue cerrada. Vuelve a iniciar sesión' });
      }

      await prisma.sesion.update({
        where: { id_sesion: sesion.id_sesion },
        data: { ultima_actividad: new Date() },
      });
    }

    req.user = { ...datos, [CAMPO_ID[datos.rol]]: datos.id };
    req.usuario = req.user; // algunos controladores antiguos leen req.usuario
    next();
  } catch (error) {
    const mensaje = error.name === 'TokenExpiredError'
      ? 'Tu sesión expiró. Vuelve a iniciar sesión'
      : 'Sesión no válida. Vuelve a iniciar sesión';
    return res.status(401).json({ mensaje });
  }
};

// RF-T-04: deja pasar solo a los roles indicados; a los demás los rechaza con 403
export const permitirRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.rol)) {
    return res.status(403).json({ mensaje: 'Permiso insuficiente para realizar esta acción' });
  }
  next();
};

// Pone en el body el id del usuario que viene en el token (no el que manda el cliente).
// Así validarDueno, validarContador y los schemas leen el id real de la sesión.
// Va DESPUÉS de autenticar y, en gastos, DESPUÉS de subirEvidencia (multer reemplaza req.body).
export const idDesdeSesion = (req, res, next) => {
  req.body = req.body ?? {};
  delete req.body.id_dueno;
  delete req.body.id_contador;
  if (req.user?.rol === 'DUENO') req.body.id_dueno = req.user.id_dueno;
  if (req.user?.rol === 'CONTADOR') req.body.id_contador = req.user.id_contador;
  next();
};