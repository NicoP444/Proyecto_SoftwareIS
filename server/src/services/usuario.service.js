import prisma from '../config/prisma.js';
import { ValidationError } from '../utils/errores.js';
import bcrypt from 'bcrypt';

// 1. Listar todos los usuarios de todos los roles
export const ListarTodosLosUsuarios = async (id_dueno) => {
  const duenos = await prisma.dueno.findMany({
    select: { id_dueno: true, nombre: true, correo: true, estado: true }
  });
  
  const contadores = await prisma.contador.findMany({
    select: { id_contador: true, nombre: true, correo: true, estado: true }
  });

  const jefes = await prisma.jefeAreaTecnica.findMany({
    select: { id_jefe: true, nombre: true, correo: true, estado: true }
  });

  // Unificamos y etiquetamos con su rol correspondiente
  return [
    ...duenos.map(u => ({ ...u, id: u.id_dueno, rol: 'DUENO' })),
    ...contadores.map(u => ({ ...u, id: u.id_contador, rol: 'CONTADOR' })),
    ...jefes.map(u => ({ ...u, id: u.id_jefe, rol: 'JEFE_TECNICA' }))
  ];
};

// 2. Crear usuario validando correo único en las 3 tablas
export const CrearUsuarioGlobal = async ({ nombre, correo, contrasena, rol, id_dueno }) => {
  const correoLimpio = String(correo).trim().toLowerCase();
  
  // Validar si el correo ya existe en cualquiera de las tablas
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
  } else if (rolUpper === 'JEFE_TECNICA') {
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

  // Si intentan desactivar un Dueño, verificar que no sea el último activo
  if (rolUpper === 'DUENO' && estado === 'INACTIVO') {
    const duenosActivos = await prisma.dueno.count({
      where: { estado: 'ACTIVO', id_dueno: { not: idNum } }
    });

    if (duenosActivos < 1) {
      throw new ValidationError('No se puede desactivar la última cuenta de Dueño activa.', 'estado');
    }
  }

  if (rolUpper === 'DUENO') {
    return prisma.dueno.update({
      where: { id_dueno: idNum },
      data: { estado: estado.toUpperCase() }
    });
  } else if (rolUpper === 'CONTADOR') {
    return prisma.contador.update({
      where: { id_contador: idNum },
      data: { estado: estado.toUpperCase() }
    });
  } else if (rolUpper === 'JEFE_TECNICA') {
    return prisma.jefeAreaTecnica.update({
      where: { id_jefe: idNum },
      data: { estado: estado.toUpperCase() }
    });
  } else {
    throw new ValidationError('Rol no reconocido', 'rol');
  }
};