import prisma from '../config/prisma.js';

// TODO: reemplazar por el id del dueño autenticado (JWT) cuando el login se conecte a estos módulos
const ID_DUENO_DEMO = 1;

export async function listarClientes() {
  return prisma.cliente.findMany({
    where: { id_dueno: ID_DUENO_DEMO },
    orderBy: { nombre: 'asc' }
  });
}

export async function crearCliente(datos) {
  return prisma.cliente.create({
    data: {
      nombre: datos.nombre,
      contacto: datos.contacto || null,
      telefono: datos.telefono,
      correo: datos.correo || null,
      id_dueno: ID_DUENO_DEMO
    }
  });
}