import prisma from '../config/prisma.js'; // llamamos a la base de datos
import { ValidationError } from '../utils/errores.js';// ajusta la ruta a tu PrismaClient

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




