import prisma from '../config/prisma.js';
import { ValidationError } from '../utils/errores.js';
import bcrypt from 'bcrypt';

// 1. Listar todos los usuarios sin exponer contraseñas y con rol JEFE_TECNICO
export const ListarTodosLosUsuarios = async () => {
  const duenos = await prisma.dueno.findMany({
    select: { id_dueno: true, nombre: true, correo: true, estado: true }
  });
  
  const contadores = await prisma.contador.findMany({
    select: { id_contador: true, nombre: true, correo: true, estado: true }
  });

  const jefes = await prisma.jefeAreaTecnica.findMany({
    select: { id_jefe: true, nombre: true, correo: true, estado: true }
  });

  return [
    ...duenos.map(u => ({ ...u, id: u.id_dueno, rol: 'DUENO' })),
    ...contadores.map(u => ({ ...u, id: u.id_contador, rol: 'CONTADOR' })),
    ...jefes.map(u => ({ ...u, id: u.id_jefe, rol: 'JEFE_TECNICO' }))
  ];
};

// 2. Crear usuario validando correo único global
export const CrearUsuarioGlobal = async ({ nombre, correo, contrasena, rol }) => {
  const correoLimpio = String(correo).trim().toLowerCase();
  
  const [existeDueno, existeContador, existeJefe] = await Promise.all([
    prisma.dueno.findUnique({ where: { correo: correoLimpio } }),
    prisma.contador.findUnique({ where: { correo: correoLimpio } }),
    prisma.jefeAreaTecnica.findUnique({ where: { correo: correoLimpio } })
  ]);

  if (existeDueno || existeContador || existeJefe) {
    throw new ValidationError('Este correo electrónico ya está registrado en el sistema', 'correo');
  }

  const hashedPassword = await bcrypt.hash(contrasena, 10);
  const rolUpper = String(rol).toUpperCase();

  if (rolUpper === 'DUENO') {
    return prisma.dueno.create({
      data: { nombre: String(nombre).trim(), correo: correoLimpio, contrasena: hashedPassword }
    });
  } else if (rolUpper === 'CONTADOR') {
    return prisma.contador.create({
      data: { nombre: String(nombre).trim(), correo: correoLimpio, contrasena: hashedPassword }
    });
  } else if (rolUpper === 'JEFE_TECNICO') {
    return prisma.jefeAreaTecnica.create({
      data: { nombre: String(nombre).trim(), correo: correoLimpio, contrasena: hashedPassword }
    });
  } else {
    throw new ValidationError('Rol inválido especificado', 'rol');
  }
};

// 3. Desactivar o modificar usuario cuidando la regla del último Dueño
export const ActualizarEstadoUsuario = async (id, rol, { estado }) => {
  const idNum = Number(id);
  const rolUpper = String(rol).toUpperCase();

  if (rolUpper === 'DUENO' && estado === 'INACTIVO') {
    const duenosActivos = await prisma.dueno.count({
      where: { estado: 'ACTIVO', id_dueno: { not: idNum } }
    });

    if (duenosActivos < 1) {
      throw new ValidationError('No se puede desactivar la última cuenta de Dueño activa.', 'estado');
    }
  }

  const nuevoEstado = String(estado).toUpperCase();

  if (rolUpper === 'DUENO') {
    return prisma.dueno.update({
      where: { id_dueno: idNum },
      data: { estado: nuevoEstado }
    });
  } else if (rolUpper === 'CONTADOR') {
    return prisma.contador.update({
      where: { id_contador: idNum },
      data: { estado: nuevoEstado }
    });
  } else if (rolUpper === 'JEFE_TECNICO') {
    return prisma.jefeAreaTecnica.update({
      where: { id_jefe: idNum },
      data: { estado: nuevoEstado }
    });
  } else {
    throw new ValidationError('Rol no reconocido', 'rol');
  }
};