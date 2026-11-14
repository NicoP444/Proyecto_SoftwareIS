import prisma from '../config/prisma.js';

/**
 * Obtiene o crea un registro en mes_contable para (anio, mes).
 * Si el mes ya está CERRADO, impide registrar nuevos gastos fijos.
 */
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

/**
 * RF-P8-01: Registrar gasto fijo mensual
 */
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

/**
 * Listar gastos fijos de un mes y año específico
 */
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