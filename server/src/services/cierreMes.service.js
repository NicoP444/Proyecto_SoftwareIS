import prisma from '../config/prisma.js';
import { obtenerResumenFinancieroMensualService } from './resumenMensual.service.js';
import { ValidationError } from '../utils/errores.js';

export const validarPreCierreMesService = async ({ anio, mes }) => {
  const fechaInicio = new Date(Date.UTC(anio, mes - 1, 1));
  const fechaFin = new Date(Date.UTC(anio, mes, 1));

  const mesContable = await prisma.mesContable.findUnique({
    where: { anio_mes: { anio, mes } },
  });

  if (mesContable?.estado === 'CERRADO') {
    return {
      puede_cerrar: false,
      ya_cerrado: true,
      eventos_abiertos: [],
      advertencias: {
        acuerdos_vencidos: [],
        remuneraciones_pendientes: [],
      },
    };
  }

  // 1. Bloqueante: todos los eventos del mes deben estar cerrados (CERRADO)
  const eventosAbiertos = await prisma.evento.findMany({
    where: {
      fecha: { gte: fechaInicio, lt: fechaFin },
      estado: { not: 'CERRADO' },
    },
    select: {
      id_evento: true,
      tipo: true,
      fecha: true,
      estado: true,
    },
    orderBy: { fecha: 'asc' },
  });

  // 2. Advertencia no bloqueante: acuerdos vencidos o incumplidos
  let acuerdosVencidos = [];
  try {
    const hoy = new Date();
    const acuerdos = await prisma.acuerdoAuspicio.findMany({
      where: {
        OR: [
          { estado: 'VENCIDO' },
          { estado: { in: ['PENDIENTE', 'PARCIAL'] }, fecha_comprometida: { lt: hoy } },
        ],
      },
      include: {
        auspiciador: { select: { nombre: true } },
      },
    });
    acuerdosVencidos = acuerdos.map((a) => ({
      id_acuerdo: a.id_acuerdo,
      auspiciador: a.auspiciador?.nombre || 'Auspiciador',
      fecha_fin: a.fecha_comprometida,
      monto_comprometido: Number(a.monto_comprometido || 0),
    }));
  } catch (e) {
    console.warn('Advertencia al consultar acuerdos vencidos:', e.message);
  }

  // 3. Advertencia no bloqueante: asignaciones sin pago de remuneración
  let remuneracionesPendientes = [];
  try {
    const asignacionesSinPago = await prisma.asignacionPersonal.findMany({
      where: {
        evento: {
          fecha: { gte: fechaInicio, lt: fechaFin },
        },
        remuneracion: { gt: 0 },
        pagos_remuneracion: {
          none: {},
        },
      },
      include: {
        trabajador: { select: { nombre: true } },
        evento: { select: { id_evento: true, tipo: true } },
      },
    });
    remuneracionesPendientes = asignacionesSinPago.map((asig) => ({
      id_asignacion: asig.id_asignacion,
      trabajador: asig.trabajador?.nombre || 'Trabajador',
      evento: `#${asig.evento.id_evento} · ${asig.evento.tipo}`,
      monto_pactado: Number(asig.remuneracion || 0),
    }));
  } catch (e) {
    console.warn('Advertencia al consultar remuneraciones pendientes:', e.message);
  }

  return {
    puede_cerrar: eventosAbiertos.length === 0,
    ya_cerrado: false,
    eventos_abiertos: eventosAbiertos,
    advertencias: {
      acuerdos_vencidos: acuerdosVencidos,
      remuneraciones_pendientes: remuneracionesPendientes,
    },
  };
};

export const cerrarMesContableService = async ({ anio, mes, id_contador }) => {
  const validacion = await validarPreCierreMesService({ anio, mes });

  if (validacion.ya_cerrado) {
    throw new ValidationError('Este período contable ya se encuentra cerrado.');
  }

  if (!validacion.puede_cerrar) {
    throw new ValidationError(
      `No se puede cerrar el mes porque hay ${validacion.eventos_abiertos.length} evento(s) sin cerrar.`
    );
  }

  const resumen = await obtenerResumenFinancieroMensualService({ anio, mes });

  const contadorId = Number(id_contador);
  if (!Number.isInteger(contadorId) || contadorId <= 0) {
    throw new ValidationError('No se pudo identificar al Contador que firma el cierre.');
  }

  const cierre = await prisma.mesContable.upsert({
    where: { anio_mes: { anio, mes } },
    update: {
      estado: 'CERRADO',
      fecha_cierre: new Date(),
      id_contador: contadorId,
      total_ingresos: resumen.ingresos_clientes,
      total_aportes: resumen.aportes_auspiciadores,
      total_remuneraciones: resumen.remuneraciones,
      total_gastos_evento: resumen.gastos_eventos,
      total_gastos_fijos: resumen.gastos_fijos,
      total_perdidas: resumen.perdidas_inventario,
      utilidad_neta: resumen.utilidad_neta,
    },
    create: {
      anio,
      mes,
      estado: 'CERRADO',
      fecha_cierre: new Date(),
      id_contador: contadorId,
      total_ingresos: resumen.ingresos_clientes,
      total_aportes: resumen.aportes_auspiciadores,
      total_remuneraciones: resumen.remuneraciones,
      total_gastos_evento: resumen.gastos_eventos,
      total_gastos_fijos: resumen.gastos_fijos,
      total_perdidas: resumen.perdidas_inventario,
      utilidad_neta: resumen.utilidad_neta,
    },
    include: {
      contador: { select: { nombre: true } },
    },
  });

  return {
    mensaje: 'Período contable cerrado exitosamente.',
    mes_contable: cierre,
    advertencias: validacion.advertencias,
  };
};