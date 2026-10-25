import prisma from '../config/prisma.js';
import { ValidationError, NotFoundError } from '../utils/errores.js';

const rolSelect = { // creamos el objeto.
  id_rol: true,
  nombre: true,
  porcentaje_referencial: true,
  estado: true,
};

//obtenemos los trabajadores del dueño
const obtenerTrabajador = async (idTrabajador, idDueno) => {
  const trabajador = await prisma.trabajador.findFirst({
    where: { id_trabajador: idTrabajador, id_dueno: idDueno },
    select: { id_trabajador: true, nombre: true, estado: true },
  });
  if (!trabajador) throw new NotFoundError('Trabajador no encontrado');
  return trabajador;
};

// Igual que arriba, pero para un rol
const obtenerRol = async (idRol, idDueno) => {
  const rol = await prisma.rolTrabajo.findFirst({
    where: { id_rol: idRol, id_dueno: idDueno },
    select: { id_rol: true, nombre: true },
  });
  if (!rol) throw new NotFoundError('Rol no encontrado');
  return rol;
};

// Verifica que todos los roles existan, sean del dueño y estén activos
const validarRoles = async (idsRoles, idDueno) => {
  if (idsRoles.length === 0) return;

  const roles = await prisma.rolTrabajo.findMany({
    where: { id_rol: { in: idsRoles }, id_dueno: idDueno },
    select: { id_rol: true, estado: true },
  });

  //set, estructura de datos que no permite duplicados, para comparar los roles encontrados con los enviados
  const encontrados = new Set(roles.map((r) => r.id_rol)); //creamos un arreglo de IDS
  const faltantes = idsRoles.filter((id) => !encontrados.has(id)); // verificamos que si falten roles, si faltan los agregamos a un arreglo
  if (faltantes.length) {
    throw new NotFoundError(`Roles no encontrados: ${faltantes.join(', ')}`);
  }

  const inactivos = roles.filter((r) => r.estado !== 'ACTIVO').map((r) => r.id_rol); // solo nos quedamos con los roles que no están activos y los agregamos a un arreglo
  if (inactivos.length) {
    throw new ValidationError(`Roles inactivos: ${inactivos.join(', ')}`, 'roles');
  }
};

//verificamos que si este activo, si no lo está no se le pueden asignar roles
const validarTrabajadorActivo = (trabajador) => {
  if (trabajador.estado !== 'ACTIVO') {
    throw new ValidationError('No se pueden asignar roles a un trabajador inactivo', 'id_trabajador');
  }
};

const rolesDeTrabajador = (idTrabajador) =>
  prisma.desempena
    .findMany({
      where: { id_trabajador: idTrabajador },
      select: { rol: { select: rolSelect } },
      orderBy: { rol: { nombre: 'asc' } },
    })
    .then((filas) => filas.map((f) => f.rol));


export const listarRolesDeTrabajador = async (idTrabajador, idDueno) => {
  const trabajador = await obtenerTrabajador(idTrabajador, idDueno);
  const roles = await rolesDeTrabajador(idTrabajador);
  return { trabajador: { id_trabajador: trabajador.id_trabajador, nombre: trabajador.nombre }, roles }; // objeto
};


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