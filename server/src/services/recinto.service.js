import prisma from '../config/prisma.js';

const ID_DUENO_DEMO = 1;

export async function listarRecintos() {
  return prisma.recinto.findMany({
    where: { id_dueno: ID_DUENO_DEMO },
    orderBy: { nombre: 'asc' }
  });
}

export async function crearRecinto(datos) {
  return prisma.recinto.create({
    data: {
      nombre: datos.nombre,
      comuna: datos.comuna,
      direccion: datos.direccion || null,
      id_dueno: ID_DUENO_DEMO
    }
  });
}