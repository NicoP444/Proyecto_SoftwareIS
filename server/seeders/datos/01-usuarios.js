// ============================================================================
//  1. USUARIOS (contraseña de todos: 123456)
//  Se crean o se reinician (contraseña, estado, intentos y bloqueo) en cada seed:todo.
// ============================================================================
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/base.js';

export const USUARIOS = {
  dueno: { nombre: 'Administrador Demo', correo: 'admin@demo.com' },
  contador: { nombre: 'Camila Contador', correo: 'contador@sixseven.cl' },
  jefe: { nombre: 'Javier Jefe Técnico', correo: 'jefe@sixseven.cl' },
};

// Usuarios solo para probar el inicio de sesión (son contadores)
export const USUARIOS_LOGIN = {
  bloqueado: { nombre: 'Carla Bloqueada', correo: 'bloqueado@sixseven.cl' }, // bloqueado por una semana
  inactivo: { nombre: 'Iván Inactivo', correo: 'inactivo@sixseven.cl' }, // cuenta INACTIVA
  intentos: { nombre: 'Ignacio Intentos', correo: 'intentos@sixseven.cl' }, // para equivocarse 5 veces y ver el bloqueo
};

export default async function sembrarUsuarios(ctx) {
  const hash = await bcrypt.hash('123456', 10);
  const limpio = { contrasena: hash, estado: 'ACTIVO', intentos_fallidos: 0, bloqueado_hasta: null };

  ctx.dueno = await prisma.dueno.upsert({
    where: { correo: USUARIOS.dueno.correo },
    update: { ...limpio, margen_traslado_min: 60 },
    create: { ...USUARIOS.dueno, ...limpio, margen_traslado_min: 60 },
  });
  ctx.contador = await prisma.contador.upsert({
    where: { correo: USUARIOS.contador.correo },
    update: limpio,
    create: { ...USUARIOS.contador, ...limpio },
  });
  ctx.jefe = await prisma.jefeAreaTecnica.upsert({
    where: { correo: USUARIOS.jefe.correo },
    update: limpio,
    create: { ...USUARIOS.jefe, ...limpio },
  });

  const enUnaSemana = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const login = {
    bloqueado: { ...limpio, bloqueado_hasta: enUnaSemana },
    inactivo: { ...limpio, estado: 'INACTIVO' },
    intentos: limpio,
  };
  for (const [clave, u] of Object.entries(USUARIOS_LOGIN)) {
    await prisma.contador.upsert({ where: { correo: u.correo }, update: login[clave], create: { ...u, ...login[clave] } });
  }

  console.log('Usuarios (contraseña 123456):');
  console.log(`  Dueño: ${USUARIOS.dueno.correo} · Contador: ${USUARIOS.contador.correo} · Jefe técnico: ${USUARIOS.jefe.correo}`);
  console.log(`  Login: ${USUARIOS_LOGIN.bloqueado.correo} (bloqueado) · ${USUARIOS_LOGIN.inactivo.correo} (inactivo) · ${USUARIOS_LOGIN.intentos.correo} (para bloquear)`);
}
