// Importamos la conexión a tu base de datos (asegúrate de que la ruta coincida con tu proyecto, 
// normalmente está en config como dice tu presentación)
import prisma from '../config/prisma.js'; // Ajusta esto si tu archivo de prisma se llama distinto

export const auspiciadorService = {
  
  // 1. REGISTRAR AUSPICIADOR
  async crear(datos) {
    // Le decimos a Prisma que cree un nuevo registro con los datos que lleguen
    return await prisma.auspiciador.create({
      data: datos
    });
  },

  // 2. MODIFICAR AUSPICIADOR
  async modificar(id, datos) {
    return await prisma.auspiciador.update({
      // Usamos id_auspiciador porque así lo nombraron en tu schema.prisma
      where: { id_auspiciador: Number(id) }, 
      data: datos
    });
  },

  // 3. ELIMINAR AUSPICIADOR (Aquí va la regla de negocio)
  async eliminar(id) {
    // Primero, buscamos al auspiciador y le pedimos a Prisma que incluya sus acuerdos
    const auspiciador = await prisma.auspiciador.findUnique({
      where: { id_auspiciador: Number(id) },
      include: { acuerdos: true } 
    });

    // Validamos la regla del requerimiento RF-P4-01:
    if (auspiciador.acuerdos.length > 0) {
      throw new Error("No se puede eliminar: el auspiciador tiene acuerdos registrados.");
    }

    // Si pasa la validación (no tiene acuerdos), lo eliminamos
    return await prisma.auspiciador.delete({
      where: { id_auspiciador: Number(id) }
    });
  }
};