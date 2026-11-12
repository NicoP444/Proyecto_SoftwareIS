import prisma from '../config/prisma.js';
import { ValidationError, NotFoundError } from '../utils/errores.js';

const MARGEN_MINIMO = 0;
const MARGEN_MAXIMO = 300;

// Margen de traslado actual del dueño (minutos)
export const obtenerMargenTraslado = async (id_dueno) => {
  const dueno = await prisma.dueno.findUnique({
    where: { id_dueno },
    select: { margen_traslado_min: true },
  });
  if (!dueno) throw new NotFoundError('El dueño no existe');
  return { margen_traslado_min: dueno.margen_traslado_min };
};

// RF-P3-02: define el tiempo mínimo entre dos eventos en lugares distintos (0 a 300 minutos)
export const actualizarMargenTraslado = async (id_dueno, minutos) => {
  const valor = Number(minutos);
  if (minutos === '' || minutos === null || !Number.isInteger(valor)) {
    throw new ValidationError('El margen debe ser un número entero de minutos', 'margen_traslado_min');
  }
  if (valor < MARGEN_MINIMO || valor > MARGEN_MAXIMO) {
    throw new ValidationError(`El margen debe estar entre ${MARGEN_MINIMO} y ${MARGEN_MAXIMO} minutos`, 'margen_traslado_min');
  }

  return prisma.dueno.update({
    where: { id_dueno },
    data: { margen_traslado_min: valor },
    select: { margen_traslado_min: true },
  });
};