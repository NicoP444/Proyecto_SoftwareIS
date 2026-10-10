import prisma from '../config/prisma.js';
import { ValidationError, NotFoundError } from '../utils/errores.js';

const rolSelect = {
  id_rol: true,
  nombre: true,
  porcentaje_referencial: true,
  estado: true,
};

// ---------- helpers ----------

// Busca el trabajador SOLO dentro de los del dueño.
// Si existe pero es de otro dueño, responde igual "no encontrado"
// (así un dueño no puede saber qué trabajadores tienen los demás)
const obtenerTrabajador = async (idTrabajador, idDueno, tx = prisma) => {
  const trabajador = await tx.trabajador.findFirst({
    where: { id_trabajador: idTrabajador, id_dueno: idDueno },
    select: { id_trabajador: true, nombre: true, estado: true },
  });
  if (!trabajador) throw new NotFoundError('Trabajador no encontrado');
  return trabajador;
};

// Igual que arriba, pero para un rol
const obtenerRol = async (idRol, idDueno, tx = prisma) => {
  const rol = await tx.rolTrabajo.findFirst({
    where: { id_rol: idRol, id_dueno: idDueno },
    select: { id_rol: true, nombre: true },
  });
  if (!rol) throw new NotFoundError('Rol no encontrado');
  return rol;
};

// Verifica que todos los roles existan, sean del dueño y estén activos
const validarRoles = async (idsRoles, idDueno, tx = prisma) => {
  if (idsRoles.length === 0) return;

  const roles = await tx.rolTrabajo.findMany({
    where: { id_rol: { in: idsRoles }, id_dueno: idDueno },
    select: { id_rol: true, estado: true },
  });

  const encontrados = new Set(roles.map((r) => r.id_rol));
  const faltantes = idsRoles.filter((id) => !encontrados.has(id));
  if (faltantes.length) {
    throw new NotFoundError(`Roles no encontrados: ${faltantes.join(', ')}`);
  }

  const inactivos = roles.filter((r) => r.estado !== 'ACTIVO').map((r) => r.id_rol);
  if (inactivos.length) {
    throw new ValidationError(`Roles inactivos: ${inactivos.join(', ')}`, 'roles');
  }
};

const validarTrabajadorActivo = (trabajador) => {
  if (trabajador.estado !== 'ACTIVO') {
    throw new ValidationError('No se pueden asignar roles a un trabajador inactivo', 'id_trabajador');
  }
};

const rolesDeTrabajador = (idTrabajador, tx = prisma) =>
  tx.desempena
    .findMany({
      where: { id_trabajador: idTrabajador },
      select: { rol: { select: rolSelect } },
      orderBy: { rol: { nombre: 'asc' } },
    })
    .then((filas) => filas.map((f) => f.rol));

// ---------- casos de uso ----------

export const listarRolesDeTrabajador = async (idTrabajador, idDueno) => {
  const trabajador = await obtenerTrabajador(idTrabajador, idDueno);
  const roles = await rolesDeTrabajador(idTrabajador);
  return { trabajador: { id_trabajador: trabajador.id_trabajador, nombre: trabajador.nombre }, roles };
};

// Deja al trabajador EXACTAMENTE con los roles enviados.
// Quita los que no vienen y agrega los nuevos, todo en una transacción.
export const asignarRoles = (idTrabajador, idsRoles, idDueno) =>
  prisma.$transaction(async (tx) => {
    const trabajador = await obtenerTrabajador(idTrabajador, idDueno, tx);
    validarTrabajadorActivo(trabajador);
    await validarRoles(idsRoles, idDueno, tx);

    // 1) Quitar los que ya no están seleccionados
    const { count: quitados } = await tx.desempena.deleteMany({
      where: { id_trabajador: idTrabajador, id_rol: { notIn: idsRoles } },
    });

    // 2) Agregar los nuevos (skipDuplicates ignora los que ya tenía)
    const { count: agregados } = await tx.desempena.createMany({
      data: idsRoles.map((id_rol) => ({ id_trabajador: idTrabajador, id_rol })),
      skipDuplicates: true,
    });

    const roles = await rolesDeTrabajador(idTrabajador, tx);
    return { agregados, quitados, roles };
  });

export const agregarRol = async (idTrabajador, idRol, idDueno) => {
  const trabajador = await obtenerTrabajador(idTrabajador, idDueno);
  validarTrabajadorActivo(trabajador);
  await validarRoles([idRol], idDueno);

  // Si ya lo tiene, Prisma lanza P2002 y manejarError responde 409
  await prisma.desempena.create({ data: { id_trabajador: idTrabajador, id_rol: idRol } });
  return rolesDeTrabajador(idTrabajador);
};

export const quitarRol = async (idTrabajador, idRol, idDueno) => {
  await obtenerTrabajador(idTrabajador, idDueno);

  const { count } = await prisma.desempena.deleteMany({
    where: { id_trabajador: idTrabajador, id_rol: idRol },
  });
  if (count === 0) throw new NotFoundError('El trabajador no tiene ese rol');

  return rolesDeTrabajador(idTrabajador);
};

export const listarTrabajadoresDeRol = async (idRol, idDueno) => {
  const rol = await obtenerRol(idRol, idDueno);

  const filas = await prisma.desempena.findMany({
    where: { id_rol: idRol, trabajador: { estado: 'ACTIVO', id_dueno: idDueno } },
    select: {
      trabajador: {
        select: { id_trabajador: true, nombre: true, telefono_whatsapp: true, rol_fijo: true },
      },
    },
    orderBy: { trabajador: { nombre: 'asc' } },
  });

  return { rol, trabajadores: filas.map((f) => f.trabajador) };
};