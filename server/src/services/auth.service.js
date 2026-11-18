import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.js';

const MENSAJE_ERROR_LOGIN = 'No se pudo iniciar sesión. Verifica tus datos o intenta más tarde';

// Buscar correo en las 3 tablas de perfil
async function buscarUsuario(correo) {
  const correoNormalizado = correo.trim().toLowerCase();

  const dueno = await prisma.dueno.findUnique({ where: { correo: correoNormalizado } });
  if (dueno) return { usuario: dueno, rol: 'DUENO', tabla: 'dueno', campoId: 'id_dueno' };

  const contador = await prisma.contador.findUnique({ where: { correo: correoNormalizado } });
  if (contador) return { usuario: contador, rol: 'CONTADOR', tabla: 'contador', campoId: 'id_contador' };

  const jefeArea = await prisma.jefeAreaTecnica.findUnique({ where: { correo: correoNormalizado } });
  if (jefeArea) return { usuario: jefeArea, rol: 'JEFE_TECNICO', tabla: 'jefeAreaTecnica', campoId: 'id_jefe' };

  return null;
}

// RF-T-01: Iniciar sesión
export async function iniciarSesion(correo, contrasena) {
  // 1. Buscar si el correo existe en alguna tabla
  const cuenta = await buscarUsuario(correo);

  if (!cuenta) {
    throw new Error(MENSAJE_ERROR_LOGIN);
  }

  const { usuario, rol, tabla, campoId } = cuenta;

  // 2. Verificar que la cuenta esté ACTIVA
  if (usuario.estado && usuario.estado !== 'ACTIVO') {
    throw new Error(MENSAJE_ERROR_LOGIN);
  }

  // 3. Verificar si la cuenta sigue bloqueada por 15 minutos
  if (usuario.bloqueado_hasta && new Date() < new Date(usuario.bloqueado_hasta)) {
    throw new Error(MENSAJE_ERROR_LOGIN);
  }

  // 4. Comparar la contraseña escrita con la encriptada
  const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);

  if (!contrasenaValida) {
    const nuevosIntentos = (usuario.intentos_fallidos || 0) + 1;
    const datosActualizar = { intentos_fallidos: nuevosIntentos };

    // Si llega a 5 intentos fallidos, bloqueamos por 15 minutos
    if (nuevosIntentos >= 5) {
      datosActualizar.bloqueado_hasta = new Date(Date.now() + 15 * 60 * 1000);
      datosActualizar.intentos_fallidos = 0;
    }

    await prisma[tabla].update({
      where: { [campoId]: usuario[campoId] },
      data: datosActualizar,
    });

    throw new Error(MENSAJE_ERROR_LOGIN);
  }

  // 5. Reiniciar intentos y bloqueos tras login exitoso
  await prisma[tabla].update({
    where: { [campoId]: usuario[campoId] },
    data: {
      intentos_fallidos: 0,
      bloqueado_hasta: null,
    },
  });

  // 6. Registrar apertura de sesión en la tabla Sesion
  const ahora = new Date();
  const sesion = await prisma.sesion.create({
    data: {
      fecha_hora_inicio: ahora,
      ultima_actividad: ahora,
      [campoId]: usuario[campoId],
    },
  });

  // 7. Crear el token JWT incluyendo id_sesion y el campoId específico
  const payloadToken = {
    id: usuario[campoId],
    [campoId]: usuario[campoId],
    id_sesion: sesion.id_sesion,
    correo: usuario.correo,
    rol,
  };

  const token = jwt.sign(payloadToken, JWT_SECRET, { expiresIn: '8h' });

  // 8. Retornar los datos limpios (sin contraseña) y el token
  return {
    mensaje: 'Inicio de sesión exitoso',
    token,
    id_sesion: sesion.id_sesion,
    usuario: {
      id: usuario[campoId],
      [campoId]: usuario[campoId],
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol,
    },
  };
}

// RF-T-02: Cerrar sesión
export async function cerrarSesion(idSesion) {
  if (!idSesion) {
    return { mensaje: 'Sesión cerrada' };
  }

  const sesionExistente = await prisma.sesion.findUnique({
    where: { id_sesion: Number(idSesion) },
  });

  if (sesionExistente && !sesionExistente.fecha_hora_cierre) {
    await prisma.sesion.update({
      where: { id_sesion: Number(idSesion) },
      data: { fecha_hora_cierre: new Date() },
    });
  }

  return { mensaje: 'Sesión cerrada correctamente' };
}