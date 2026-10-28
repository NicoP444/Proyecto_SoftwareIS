import prisma from '../config/prisma.js';
import { ValidationError } from '../utils/errores.js';


export const crearDisponibilidadService = async (id_trabajador, id_dueno, datos) => {
  const trabajador = await prisma.trabajador.findUnique({ where: { id_trabajador } });
  if (!trabajador) throw new ValidationError('El trabajador no existe', 'id_trabajador');
  if (trabajador.estado !== 'ACTIVO') throw new ValidationError('El trabajador está inactivo', 'id_trabajador');

  const choque = await prisma.disponibilidad.findFirst({
    where: {
      id_trabajador: Number(id_trabajador),
      // Comparamos que las fechas se solapen
      fecha_inicio: { lte: datos.fecha_termino },
      fecha_termino: { gte: datos.fecha_inicio },
      
      // Comparamos que las horas se solapen
      hora_inicio: { lt: datos.hora_termino },
      hora_termino: { gt: datos.hora_inicio }
    }
  });

  if (choque) {
    throw new ValidationError(
      'El trabajador ya tiene una disponibilidad que choca con este rango de fechas y horas', 
      'choque_horario'
    );
  }
  // nro_bloque = último bloque del trabajador + 1
  const ultimo = await prisma.disponibilidad.findFirst({
    where: { id_trabajador },
    orderBy: { nro_bloque: 'desc' },
  });
  const nro_bloque = ultimo ? ultimo.nro_bloque + 1 : 1;

  return prisma.disponibilidad.create({
    data: { id_trabajador, nro_bloque, id_dueno, ...datos },
  });
};




// Convierte las fechas y horas de Prisma a texto simple para el front
const formatear = (d) => ({
  id_trabajador: d.id_trabajador,
  nro_bloque: d.nro_bloque,
  fecha_inicio: d.fecha_inicio.toISOString().slice(0, 10),   // "2026-11-03"
  fecha_termino: d.fecha_termino.toISOString().slice(0, 10),
  hora_inicio: d.hora_inicio.toISOString().slice(11, 16),     // "09:00"
  hora_termino: d.hora_termino.toISOString().slice(11, 16),
});

export const listarDisponibilidadService = async (id_trabajador) => {
  const trabajador = await prisma.trabajador.findUnique({ where: { id_trabajador } });
  if (!trabajador) throw new ValidationError('El trabajador no existe', 'id_trabajador');

  const bloques = await prisma.disponibilidad.findMany({
    where: { id_trabajador },
    orderBy: [{ fecha_inicio: 'asc' }, { hora_inicio: 'asc' }],
  });

  return bloques.map(formatear);
};


export const eliminarDisponibilidadService = async (id_trabajador, nro_bloque) => {
  const trabajador = await prisma.trabajador.findUnique({ where: { id_trabajador } });
  if (!trabajador) throw new ValidationError('El trabajador no existe', 'id_trabajador');

  const bloqueExistente = await prisma.disponibilidad.findFirst({
    where: { id_trabajador, nro_bloque }
  });
  if (!bloqueExistente) throw new NotFoundError('El bloque de disponibilidad no existe');

  await prisma.disponibilidad.deleteMany({
    where: { id_trabajador, nro_bloque }
  });

  return true;
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
      nro_bloque: { not: Number(nro_bloque) }, // Excluimos el bloque que estamos editando
      fecha_inicio: { lte: datos.fecha_termino },
      fecha_termino: { gte: datos.fecha_inicio },
      hora_inicio: { lt: datos.hora_termino },
      hora_termino: { gt: datos.hora_inicio }
    }
  });

  if (choque) {
    throw new ValidationError(
      'El trabajador ya tiene una disponibilidad que choca con este rango de fechas y horas', 
      'choque_horario'
    );
  }

  // Utilizamos updateMany por si tu modelo en Prisma no tiene un @id compuesto explícito
  await prisma.disponibilidad.updateMany({
    where: { id_trabajador, nro_bloque },
    data: datos,
  });

  return prisma.disponibilidad.findFirst({
    where: { id_trabajador, nro_bloque }
  });
};