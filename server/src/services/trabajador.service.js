import prisma from '../config/prisma.js'; // llamamos a la base de datos
import { ValidationError } from '../utils/errores.js';// ajusta la ruta a tu PrismaClient


//obtener trabajador por id
const ObtenerTrabajador = async (id_trabajador) => {
  const trabajador = await prisma.trabajador.findUnique({
    where: { id_trabajador: Number(id_trabajador) },
  });

  if (!trabajador) {
    throw new ValidationError('El trabajador no existe', 'id_trabajador');
  }

  return trabajador;
};

//obterner trabajadores, una lista
export const ListarTrabajadores = async (id_dueno) => {
  const trabajadores = await prisma.trabajador.findMany({
    where: { id_dueno: Number(id_dueno) },
    orderBy: { nombre: 'asc' },
    include: { roles: { include: { rol: true } } },
  });

  // El front usa minúscula: 'ACTIVO' -> 'activo'
  return trabajadores.map((t) => ({ ...t, estado: t.estado.toLowerCase() }));
};


// crear trabajador
export const CrearTrabajador = async ({ nombre, telefono_whatsapp, correo, observaciones, id_dueno, estado }) => {
  
  return prisma.trabajador.create({
    data: {
      nombre: nombre,
      telefono_whatsapp: telefono_whatsapp,
      correo: correo,
      observaciones: observaciones ?? null, // si no hay nada es vacio, no undefined
      estado: estado,
      dueno: { connect: { id_dueno: Number(id_dueno) } },
    },
  });
};


export const ActualizarTrabajador = async (id_trabajador, { nombre, telefono_whatsapp, correo, observaciones, estado }) => {
  await ObtenerTrabajador(id_trabajador); // verificamos si existe el trabajador, si no existe lanza un error. 
  return prisma.trabajador.update({
    where: { id_trabajador: Number(id_trabajador) },
    data: {
      ...(nombre !== undefined && { nombre: nombre }),
      ...(telefono_whatsapp !== undefined && { telefono_whatsapp: telefono_whatsapp }),
      ...(correo !== undefined && { correo: correo }),
      ...(observaciones !== undefined && { observaciones: observaciones }),
      ...(estado !== undefined && { estado: estado }),
    },
  });
};