import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma.js';
import { ValidationError, NotFoundError } from '../utils/errores.js';

const TIENE_LETRAS_REGEX = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/;

const eliminarArchivoLocal = (rutaRelativa) => {
  if (!rutaRelativa || !rutaRelativa.startsWith('/uploads/')) return;
  const rutaCompleta = path.join(process.cwd(), rutaRelativa.replace(/^\//, ''));
  if (fs.existsSync(rutaCompleta)) {
    try {
      fs.unlinkSync(rutaCompleta);
    } catch {
      // Ignorar error de borrado físico
    }
  }
};

export const obtenerOCrearMesAbierto = async (anio, mes, id_contador) => {
  let mesContable = await prisma.mesContable.findUnique({
    where: { anio_mes: { anio: Number(anio), mes: Number(mes) } },
  });

  if (!mesContable) {
    mesContable = await prisma.mesContable.create({
      data: {
        anio: Number(anio),
        mes: Number(mes),
        estado: 'ABIERTO',
        id_contador: Number(id_contador),
      },
    });
  }

  return mesContable;
};

export const registrarGastoFijoService = async ({ anio, mes, descripcion, monto, evidencia, id_contador }) => {
  const contadorId = Number(id_contador);
  if (!Number.isInteger(contadorId) || contadorId <= 0) {
    throw new ValidationError('No se pudo identificar al Contador que registra el gasto.');
  }

  const mesContable = await obtenerOCrearMesAbierto(anio, mes, contadorId);

  if (mesContable.estado === 'CERRADO') {
    throw new ValidationError(
      `El período ${String(mes).padStart(2, '0')}/${anio} ya está cerrado. No se pueden agregar gastos fijos.`
    );
  }

  return await prisma.gastoFijo.create({
    data: {
      descripcion,
      monto: Number(monto),
      evidencia: evidencia || null,
      id_mes: mesContable.id_mes,
      id_contador: contadorId,
    },
    include: {
      mes: { select: { id_mes: true, anio: true, mes: true, estado: true } },
      contador: { select: { id_contador: true, nombre: true } },
    },
  });
};

export const actualizarGastoFijoService = async (id_gasto_fijo, { descripcion, monto, evidencia, id_contador }) => {
  const existente = await prisma.gastoFijo.findUnique({
    where: { id_gasto_fijo: Number(id_gasto_fijo) },
    include: { mes: true },
  });

  if (!existente) {
    throw new NotFoundError('El gasto fijo especificado no existe.');
  }

  if (existente.mes.estado === 'CERRADO') {
    throw new ValidationError('No se puede modificar un gasto fijo de un mes ya cerrado.');
  }

  const ahora = new Date();
  if (existente.mes.anio !== ahora.getFullYear() || existente.mes.mes !== ahora.getMonth() + 1) {
    throw new ValidationError('Solo se pueden modificar gastos fijos del período actual en curso.');
  }

  const dataActualizar = {
    descripcion,
    monto: Number(monto),
    id_contador: Number(id_contador),
  };

  if (evidencia) {
    eliminarArchivoLocal(existente.evidencia);
    dataActualizar.evidencia = evidencia;
  }

  return await prisma.gastoFijo.update({
    where: { id_gasto_fijo: Number(id_gasto_fijo) },
    data: dataActualizar,
    include: {
      mes: { select: { id_mes: true, anio: true, mes: true, estado: true } },
      contador: { select: { id_contador: true, nombre: true } },
    },
  });
};

export const eliminarGastoFijoService = async (id_gasto_fijo, { motivo, id_contador } = {}) => {
  const motivoLimpio = String(motivo || '').trim();
  if (!motivoLimpio || !TIENE_LETRAS_REGEX.test(motivoLimpio)) {
    throw new ValidationError(
      'Debe ingresar un motivo explicativo válido para eliminar el gasto fijo.',
      'motivo'
    );
  }

  const contadorId = Number(id_contador);
  if (!Number.isInteger(contadorId) || contadorId <= 0) {
    throw new ValidationError('No se pudo identificar al Contador que elimina el gasto.');
  }

  const existente = await prisma.gastoFijo.findUnique({
    where: { id_gasto_fijo: Number(id_gasto_fijo) },
    include: { mes: true },
  });

  if (!existente) {
    throw new NotFoundError('El gasto fijo especificado no existe.');
  }

  if (existente.mes.estado === 'CERRADO') {
    throw new ValidationError('No se puede eliminar un gasto fijo de un mes ya cerrado.');
  }

  const ahora = new Date();
  if (existente.mes.anio !== ahora.getFullYear() || existente.mes.mes !== ahora.getMonth() + 1) {
    throw new ValidationError('Solo se pueden eliminar gastos fijos del período actual en curso.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.historialCambio.create({
      data: {
        tabla_afectada: 'gasto_fijo',
        dato: `Eliminación gasto fijo #${existente.id_gasto_fijo} (${existente.descripcion})`.slice(0, 60),
        valor_anterior: `$${Number(existente.monto).toLocaleString('es-CL')}`,
        valor_nuevo: '$0 (Eliminado)',
        motivo: motivoLimpio.slice(0, 255),
        id_contador: contadorId,
        id_evento: null,
      },
    });

    await tx.gastoFijo.delete({
      where: { id_gasto_fijo: Number(id_gasto_fijo) },
    });
  });

  eliminarArchivoLocal(existente.evidencia);
  return { id_gasto_fijo: Number(id_gasto_fijo) };
};

export const listarGastosFijosPorMesService = async (anio, mes) => {
  const mesContable = await prisma.mesContable.findUnique({
    where: { anio_mes: { anio: Number(anio), mes: Number(mes) } },
    include: {
      gastos_fijos: {
        include: {
          contador: { select: { id_contador: true, nombre: true } },
        },
        orderBy: { id_gasto_fijo: 'desc' },
      },
    },
  });

  if (!mesContable) {
    return {
      anio: Number(anio),
      mes: Number(mes),
      estado: 'ABIERTO',
      total_gastos_fijos: 0,
      gastos_fijos: [],
    };
  }

  const total = mesContable.gastos_fijos.reduce((acc, g) => acc + Number(g.monto || 0), 0);

  return {
    id_mes: mesContable.id_mes,
    anio: mesContable.anio,
    mes: mesContable.mes,
    estado: mesContable.estado,
    total_gastos_fijos: total,
    gastos_fijos: mesContable.gastos_fijos,
  };
};