import prisma from '../config/prisma.js'; // llamamos a la base de datos
import { ValidationError } from '../utils/errores.js';// ajusta la ruta a tu PrismaClient


// ver todos los roles...
export const ListarTrabajadores = (id_dueno) =>
  prisma.rolTrabajo.findMany({
    where: { id_dueno: Number(id_dueno) },
    orderBy: { nombre: 'asc' },
    select: {
      nombre: true,
      porcentaje_referencial: true,
      estado: true
    }
  });


export const CrearRol = async ({nombre, porcentaje_referencial, id_dueno}) =>{
    const nuevo = await prisma.rolTrabajo.create({
      data: {
        nombre: nombre,
        porcentaje_referencial: porcentaje_referencial,
        dueno: { connect: { id_dueno: Number(id_dueno) } },
      },
    })
}

