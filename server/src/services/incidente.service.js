import prisma from '../config/prisma.js';

export const createIncidenteService = async (data, id_jefe) => {
  const { tipo, fecha, descripcion, codigo, id_evento, id_trabajador, costo_reparacion } = data;

  return await prisma.$transaction(async (tx) => {
    // 1. Obtener y verificar el equipo
    const equipo = await tx.equipo.findUnique({
      where: { codigo },
    });

    if (!equipo) {
      const error = new Error('El equipo especificado no existe.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Determinar el valor del incidente y nuevo estado del equipo según RF-P6-03
    let valorIncidente = 0;
    let nuevoEstadoEquipo = equipo.estado;

    if (tipo === 'DANO') {
      if (!costo_reparacion || Number(costo_reparacion) <= 0) {
        const error = new Error('Para daños se requiere el costo estimado de reparación.');
        error.statusCode = 400;
        throw error;
      }
      valorIncidente = Math.round(Number(costo_reparacion));
      nuevoEstadoEquipo = 'DANADO';
    } else if (tipo === 'PERDIDA') {
      valorIncidente = equipo.valor_compra;
      nuevoEstadoEquipo = 'PERDIDO';
    } else if (tipo === 'ROBO') {
      valorIncidente = equipo.valor_compra;
      nuevoEstadoEquipo = 'ROBADO';
    } else {
      const error = new Error('Tipo de incidente inválido.');
      error.statusCode = 400;
      throw error;
    }

    // 3. Crear el registro del incidente
    const nuevoIncidente = await tx.incidente.create({
      data: {
        tipo,
        fecha: new Date(fecha),
        descripcion,
        valor: valorIncidente,
        codigo,
        id_evento: id_evento ? Number(id_evento) : null,
        id_trabajador: id_trabajador ? Number(id_trabajador) : null,
        id_jefe: Number(id_jefe),
      },
      include: {
        equipo: true,
        evento: true,
        trabajador: true,
      },
    });

    // 4. Actualizar el estado del equipo (Postcondición)
    await tx.equipo.update({
      where: { codigo },
      data: { estado: nuevoEstadoEquipo },
    });

    // 5. Si está vinculado a un evento, actualizar rentabilidad final (Postcondición)
    if (id_evento) {
      const evento = await tx.evento.findUnique({
        where: { id_evento: Number(id_evento) },
      });

      if (evento) {
        const rentabilidadActual = evento.rentabilidad_final ?? (evento.precio_acordado - evento.gastos_estimados);
        await tx.evento.update({
          where: { id_evento: Number(id_evento) },
          data: {
            rentabilidad_final: rentabilidadActual - valorIncidente,
          },
        });
      }
    }

    return nuevoIncidente;
  });
};

export const getIncidentesService = async () => {
  return await prisma.incidente.findMany({
    include: {
      equipo: { select: { codigo: true, nombre: true, categoria: true, estado: true } },
      evento: { select: { id_evento: true, tipo: true, fecha: true } },
      trabajador: { select: { id_trabajador: true, nombre: true } },
      jefe: { select: { id_jefe: true, nombre: true } },
    },
    orderBy: { fecha: 'desc' },
  });
};