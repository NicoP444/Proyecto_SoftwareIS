import prisma from '../config/prisma.js';
import { ValidationError, NotFoundError } from '../utils/errores.js';

export const crearDisponibilidadService = async (id_trabajador, id_dueno, datos) => {
  const trabajador = await prisma.trabajador.findUnique({ where: { id_trabajador } });
  if (!trabajador) throw new ValidationError('El trabajador no existe', 'id_trabajador');
  if (trabajador.estado !== 'ACTIVO') throw new ValidationError('El trabajador está inactivo', 'id_trabajador');

  const choque = await prisma.disponibilidad.findFirst({
    where: {
      id_trabajador: Number(id_trabajador),
      fecha_inicio: { lte: datos.fecha_termino },
      fecha_termino: { gte: datos.fecha_inicio }
    }
  });

  if (choque) {
    throw new ValidationError(
      'El trabajador ya tiene una disponibilidad que choca con este rango de fechas', 
      'choque_fechas'
    );
  }

  const ultimo = await prisma.disponibilidad.findFirst({
    where: { id_trabajador },
    orderBy: { nro_bloque: 'desc' },
  });
  const nro_bloque = ultimo ? ultimo.nro_bloque + 1 : 1;

  return prisma.disponibilidad.create({
    data: { id_trabajador, nro_bloque, id_dueno, ...datos },
  });
};

export const actualizarDisponibilidadService = async (id_trabajador, nro_bloque, datos) => {
  const trabajador = await prisma.trabajador.findUnique({ where: { id_trabajador } });
  if (!trabajador) throw new ValidationError('El trabajador no existe', 'id_trabajador');
  if (trabajador.estado !== 'ACTIVO') throw new ValidationError('El trabajador está inactivo', 'id_trabajador');

  const bloqueExistente = await prisma.disponibilidad.findFirst({
    where: { id_trabajador, nro_bloque }
  });
  if (!bloqueExistente) throw new NotFoundError('El bloque de disponibilidad no existe');

  const choque = await prisma.disponibilidad.findFirst({
    where: {
      id_trabajador: Number(id_trabajador),
      nro_bloque: { not: Number(nro_bloque) },
      fecha_inicio: { lte: datos.fecha_termino },
      fecha_termino: { gte: datos.fecha_inicio }
    }
  });

  if (choque) {
    throw new ValidationError(
      'El trabajador ya tiene una disponibilidad que choca con este rango de fechas', 
      'choque_fechas'
    );
  }

  await prisma.disponibilidad.updateMany({
    where: { id_trabajador, nro_bloque },
    data: datos,
  });

  return prisma.disponibilidad.findFirst({
    where: { id_trabajador, nro_bloque }
  });
};

// Nueva función de eliminación
export const eliminarDisponibilidadService = async (id_trabajador, nro_bloque) => {
  const bloqueExistente = await prisma.disponibilidad.findFirst({
    where: { id_trabajador, nro_bloque }
  });
  if (!bloqueExistente) throw new NotFoundError('El bloque de disponibilidad no existe');

  await prisma.disponibilidad.delete({
    where: {
      id_trabajador_nro_bloque: { id_trabajador, nro_bloque }
    }
  });
};

const formatear = (d) => ({
  id_trabajador: d.id_trabajador,
  nro_bloque: d.nro_bloque,
  fecha_inicio: d.fecha_inicio.toISOString().slice(0, 10),
  fecha_termino: d.fecha_termino.toISOString().slice(0, 10),
});

export const listarDisponibilidadService = async (id_trabajador) => {
  const trabajador = await prisma.trabajador.findUnique({ where: { id_trabajador } });
  if (!trabajador) throw new ValidationError('El trabajador no existe', 'id_trabajador');

  const bloques = await prisma.disponibilidad.findMany({
    where: { id_trabajador },
    orderBy: [{ fecha_inicio: 'asc' }],
  });

  return bloques.map(formatear);
};