import prisma from '../config/prisma.js';

export const listarHistorialCambios = async () => {
  return prisma.historialCambio.findMany({
    orderBy: { fecha_hora: 'desc' },
  });
};

export const crearHistorialCambio = async (datos) => {
  return prisma.historialCambio.create({
    data: {
      fecha_hora: new Date(),
      tabla_afectada: datos.tabla_afectada,
      dato: datos.dato,
      valor_anterior: datos.valor_anterior ?? null,
      valor_nuevo: datos.valor_nuevo ?? null,
      motivo: datos.motivo ?? null,
      id_dueno: Number(datos.id_dueno),
      id_evento: datos.id_evento ? Number(datos.id_evento) : null,
    },
  });
};