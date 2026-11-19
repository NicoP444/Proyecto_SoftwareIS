import prisma from '../config/prisma.js';
import { ValidationError } from '../utils/errores.js';
import bcrypt from 'bcrypt';

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

export const CrearUsuarioGlobal = async ({ nombre, correo, contrasena, rol }) => {
  const nombreLimpio = String(nombre || '').trim();
  const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
  if (!regexNombre.test(nombreLimpio)) {
    throw new ValidationError('El nombre completo solo debe contener letras y espacios', 'nombre');
  }

  if (!contrasena || String(contrasena).trim().length < 6) {
    throw new ValidationError('La contraseña es obligatoria y debe tener al menos 6 caracteres', 'contrasena');
  }

  const correoLimpio = String(correo || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
    throw new ValidationError('El correo debe tener el formato texto@texto.texto', 'correo');
  }

  const rolUpper = String(rol || '').toUpperCase();
  if (rolUpper === 'DUENO') {
    throw new ValidationError('No está permitido crear nuevas cuentas de Dueño', 'rol');
  }

  const [existeDueno, existeContador, existeJefe] = await Promise.all([
    prisma.dueno.findUnique({ where: { correo: correoLimpio } }),
    prisma.contador.findUnique({ where: { correo: correoLimpio } }),
    prisma.jefeAreaTecnica.findUnique({ where: { correo: correoLimpio } })
  ]);

  if (existeDueno || existeContador || existeJefe) {
    throw new ValidationError('Este correo electrónico ya está registrado en el sistema', 'correo');
  }

  const hashedPassword = await bcrypt.hash(contrasena, 10);

  if (rolUpper === 'CONTADOR') {
    return prisma.contador.create({
      data: { nombre: nombreLimpio, correo: correoLimpio, contrasena: hashedPassword },
      select: { id_contador: true, nombre: true, correo: true, estado: true }
    });
  } else if (rolUpper === 'JEFE_TECNICO') {
    return prisma.jefeAreaTecnica.create({
      data: { nombre: nombreLimpio, correo: correoLimpio, contrasena: hashedPassword },
      select: { id_jefe: true, nombre: true, correo: true, estado: true }
    });
  } else {
    throw new ValidationError('Rol inválido (solo se permite CONTADOR o JEFE_TECNICO)', 'rol');
  }
};

export const ModificarUsuarioGlobal = async (id, { nombre, correo, rol }) => {
  const idNum = Number(id);
  const rolUpper = String(rol).toUpperCase();
  const correoLimpio = String(correo || '').trim().toLowerCase();
  const nombreLimpio = String(nombre || '').trim();

  const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
  if (!regexNombre.test(nombreLimpio)) {
    throw new ValidationError('El nombre completo solo debe contener letras y espacios', 'nombre');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
    throw new ValidationError('El correo debe tener el formato texto@texto.texto', 'correo');
  }

  if (rolUpper === 'DUENO') {
    return prisma.dueno.update({
      where: { id_dueno: idNum },
      data: { nombre: nombreLimpio, correo: correoLimpio },
      select: { id_dueno: true, nombre: true, correo: true, estado: true }
    });
  } else if (rolUpper === 'CONTADOR') {
    return prisma.contador.update({
      where: { id_contador: idNum },
      data: { nombre: nombreLimpio, correo: correoLimpio },
      select: { id_contador: true, nombre: true, correo: true, estado: true }
    });
  } else if (rolUpper === 'JEFE_TECNICO') {
    return prisma.jefeAreaTecnica.update({
      where: { id_jefe: idNum },
      data: { nombre: nombreLimpio, correo: correoLimpio },
      select: { id_jefe: true, nombre: true, correo: true, estado: true }
    });
  } else {
    throw new ValidationError('Rol no reconocido para modificar', 'rol');
  }
};

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
      data: { estado: nuevoEstado },
      select: { id_dueno: true, nombre: true, correo: true, estado: true }
    });
  } else if (rolUpper === 'CONTADOR') {
    return prisma.contador.update({
      where: { id_contador: idNum },
      data: { estado: nuevoEstado },
      select: { id_contador: true, nombre: true, correo: true, estado: true }
    });
  } else if (rolUpper === 'JEFE_TECNICO') {
    return prisma.jefeAreaTecnica.update({
      where: { id_jefe: idNum },
      data: { estado: nuevoEstado },
      select: { id_jefe: true, nombre: true, correo: true, estado: true }
    });
  } else {
    throw new ValidationError('Rol no reconocido', 'rol');
  }
};