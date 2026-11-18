import prisma from '../config/prisma.js';

export const auspiciadorService = {

  //OBTENER TODOS 
  async obtenerTodos() {
    return await prisma.auspiciador.findMany();
  },

  //REGISTRAR AUSPICIADOR
  async crear(datos) {
    return await prisma.auspiciador.create({
      data: datos
    });
  },

  //MODIFICAR AUSPICIADOR
  async modificar(id, datos) {
    return await prisma.auspiciador.update({
      where: { id_auspiciador: Number(id) },
      data: datos
    });
  },

  // ELIMINAR AUSPICIADOR(NO SI HAY ACUERDOS)
  async eliminar(id) {
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
  },

  //  CLASIFICAR AUSPICIADOR 
  async clasificarAuspiciador(id, clasificacion, motivo) {
    return await prisma.auspiciador.update({
      where: { id_auspiciador: Number(id) },
      data: {
        clasificacion, 
        motivo_clasificacion: motivo,
      },
    });
  }
};

// CLASIFICAR AUSPICIADOR ("CONFIABLE" o "NO_CONFIABLE", según el enum Clasificacion)
export const clasificarAuspiciador = async (id, clasificacion, motivo) => {
  return await prisma.auspiciador.update({
    where: { id_auspiciador: Number(id) },
    data: {
      clasificacion,
      motivo_clasificacion: motivo,
    },
  });
};