import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma.js';

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

export const obtenerOCrearMesAbierto = async (anio, mes, id_contador = 1) => {
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

export const registrarGastoFijoService = async ({ anio, mes, descripcion, monto, evidencia, id_contador = 1 }) => {
  const mesContable = await obtenerOCrearMesAbierto(anio, mes, id_contador);

  if (mesContable.estado === 'CERRADO') {
    const err = new Error(`El período ${String(mes).padStart(2, '0')}/${anio} ya está cerrado. No se pueden agregar gastos fijos.`);
    err.statusCode = 400;
    throw err;
  }

  const gasto = await prisma.gastoFijo.create({
    data: {
      descripcion,
      monto: Number(monto),
      evidencia: evidencia || null,
      id_mes: mesContable.id_mes,
      id_contador: Number(id_contador),
    },
    include: {
      mes: { select: { id_mes: true, anio: true, mes: true, estado: true } },
      contador: { select: { id_contador: true, nombre: true } },
    },
  });

  return gasto;
};

export const actualizarGastoFijoService = async (id_gasto_fijo, { descripcion, monto, evidencia, id_contador }) => {
  const existente = await prisma.gastoFijo.findUnique({
    where: { id_gasto_fijo: Number(id_gasto_fijo) },
    include: { mes: true },
  });

  if (!existente) {
    const err = new Error('El gasto fijo especificado no existe.');
    err.statusCode = 404;
    throw err;
  }

  if (existente.mes.estado === 'CERRADO') {
    const err = new Error('No se puede modificar un gasto fijo de un mes ya cerrado.');
    err.statusCode = 400;
    throw err;
  }

  const ahora = new Date();
  if (existente.mes.anio !== ahora.getFullYear() || existente.mes.mes !== ahora.getMonth() + 1) {
    const err = new Error('Solo se pueden modificar gastos fijos del período actual en curso.');
    err.statusCode = 400;
    throw err;
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

export const eliminarGastoFijoService = async (id_gasto_fijo) => {
  const existente = await prisma.gastoFijo.findUnique({
    where: { id_gasto_fijo: Number(id_gasto_fijo) },
    include: { mes: true },
  });

  if (!existente) {
    const err = new Error('El gasto fijo especificado no existe.');
    err.statusCode = 404;
    throw err;
  }

  if (existente.mes.estado === 'CERRADO') {
    const err = new Error('No se puede eliminar un gasto fijo de un mes ya cerrado.');
    err.statusCode = 400;
    throw err;
  }

  const ahora = new Date();
  if (existente.mes.anio !== ahora.getFullYear() || existente.mes.mes !== ahora.getMonth() + 1) {
    const err = new Error('Solo se pueden eliminar gastos fijos del período actual en curso.');
    err.statusCode = 400;
    throw err;
  }

  await prisma.gastoFijo.delete({
    where: { id_gasto_fijo: Number(id_gasto_fijo) },
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