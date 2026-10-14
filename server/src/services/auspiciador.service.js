// Importamos la conexión a tu base de datos
import prisma from '../config/prisma.js';

export const auspiciadorService = {
  // 0. OBTENER TODOS (Faltaba esta función para la lista)
  async obtenerTodos() {
    return await prisma.auspiciador.findMany();
  },

  // 1. REGISTRAR AUSPICIADOR
  async crear(datos) {
    return await prisma.auspiciador.create({
      data: datos
    });
  },

  // 2. MODIFICAR AUSPICIADOR
  async modificar(id, datos) {
    return await prisma.auspiciador.update({
      where: { id_auspiciador: Number(id) },
      data: datos
    });
  },

  // 3. ELIMINAR AUSPICIADOR (Regla de negocio RF-P4-01)
  async eliminar(id) {
    // Primero buscamos si tiene acuerdos vinculados
    const auspiciador = await prisma.auspiciador.findUnique({
      where: { id_auspiciador: Number(id) },
      include: { acuerdos: true }
    });

    if (auspiciador && auspiciador.acuerdos && auspiciador.acuerdos.length > 0) {
      throw new Error("No se puede eliminar: el auspiciador tiene acuerdos registrados.");
    }

    return await prisma.auspiciador.delete({
      where: { id_auspiciador: Number(id) }
    });
  }
};