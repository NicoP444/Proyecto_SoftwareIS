import prisma from '../config/prisma.js'; // llamamos a la base de datos
import { ValidationError } from '../utils/errores.js';// ajusta la ruta a tu PrismaClient


// ver todos los roles...
export const ListarRoles = (id_dueno) =>
  prisma.rolTrabajo.findMany({
    where: { id_dueno: Number(id_dueno) },
    orderBy: { nombre: 'asc' },
    select: {
      id_rol: true,
      nombre: true,
      porcentaje_referencial: true,
      estado: true,
    },
  });


export const CrearRol = async ({ nombre, porcentaje_referencial, id_dueno }) => {
  if (!nombre || !String(nombre).trim()) {
    throw new ValidationError('El nombre del rol es obligatorio', 'nombre');
  }

  return prisma.rolTrabajo.create({
    data: {
      nombre: String(nombre).trim(),
      porcentaje_referencial: porcentaje_referencial ?? null,
      dueno: { connect: { id_dueno: Number(id_dueno) } },
    },
  });
};



export const ActualizarRol = async (id_rol, { nombre, porcentaje_referencial }) => {
  return prisma.rolTrabajo.update({
    // El 'where' busca exactamente qué fila vamos a modificar
    where: { id_rol: Number(id_rol) },
    data: {
      // Solo se cambia lo que viene (undefined = no tocar)
      ...(nombre !== undefined && { nombre: String(nombre).trim() }),
      ...(porcentaje_referencial !== undefined && { porcentaje_referencial }),
    },
  });
};
