import prisma from '../config/prisma.js';

export const acuerdoService = {
  // 1. Obtener todos los acuerdos con datos de auspiciador y evento
  async obtenerTodos() {
    return await prisma.acuerdoAuspicio.findMany({
      include: {
        auspiciador: true,
        evento: true,
      },
      orderBy: {
        id_acuerdo: 'desc',
      },
    });
  },

  // 2. Registrar acuerdo (RF-P4-02)
  async crear(datos) {
    const {
      glosa,
      tipo_aporte,
      monto_comprometido,
      descripcion_canje,
      cant_menciones,
      fecha_comprometida,
      id_auspiciador,
      id_evento,
      id_dueno,
    } = datos;

    return await prisma.acuerdoAuspicio.create({
      data: {
        glosa,
        tipo_aporte,
        monto_comprometido: Number(monto_comprometido),
        descripcion_canje: descripcion_canje || null,
        cant_menciones: cant_menciones ? Number(cant_menciones) : null,
        fecha_comprometida: new Date(fecha_comprometida),
        estado: 'PENDIENTE',
        id_auspiciador: Number(id_auspiciador),
        id_evento: Number(id_evento),
        id_dueno: Number(id_dueno || 1),
      },
    });
  },
};