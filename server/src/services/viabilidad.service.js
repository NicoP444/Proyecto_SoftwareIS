import prisma from '../config/prisma.js';
import { ValidationError, NotFoundError } from '../utils/errores.js';
import { calcularMonto } from './remuneracion.service.js';

// Dueño: solo sus eventos. Contador no tiene id_dueno en el token: ve los eventos de la empresa
const delDueno = (idDueno) => (idDueno ? { id_dueno: idDueno } : {});

// RF-P1-06: resultado estimado de un evento (solo lee la base de datos)
export async function calcularViabilidad(id_evento, idDueno) {
  const evento = await prisma.evento.findFirst({
    where: { id_evento, ...delDueno(idDueno) },
  });
  if (!evento) throw new NotFoundError('El evento no existe');

  // Aportes comprometidos en dinero (el canje no es plata; el incobrable no se espera recibir)
  const acuerdos = await prisma.acuerdoAuspicio.findMany({
    where: { id_evento, tipo_aporte: 'DINERO', estado: { not: 'INCOBRABLE' } },
    select: { monto_comprometido: true },
  });

  // Personal asignado: porcentaje definido o, si aún no hay, el referencial del rol
  const asignaciones = await prisma.asignacionPersonal.findMany({
    where: { id_evento },
    select: {
      porcentaje: true,
      rol: { select: { porcentaje_referencial: true } },
    },
  });

  const precio = evento.precio_acordado;
  const aportes = acuerdos.reduce((suma, a) => suma + a.monto_comprometido, 0);
  const remuneraciones = asignaciones.reduce(
    (suma, a) => suma + calcularMonto(a.porcentaje ?? a.rol.porcentaje_referencial, precio),
    0,
  );
  const gastos = evento.gastos_estimados;
  const resultado = precio + aportes - remuneraciones - gastos;

  return {
    id_evento,
    estado_evento: evento.estado,
    precio_acordado: precio,
    aportes_comprometidos: aportes,
    remuneraciones_estimadas: remuneraciones,
    gastos_estimados: gastos,
    resultado,
    tipo: resultado < 0 ? 'NEGATIVO' : 'POSITIVO',
  };
}

// Guarda los gastos estimados que ingresa el Dueño y devuelve la viabilidad recalculada
export async function guardarGastosEstimados(id_evento, { gastos_estimados, motivo }, idDueno) {
  const gastos = Number(gastos_estimados);
  if (!Number.isInteger(gastos) || gastos < 0) {
    throw new ValidationError('Los gastos estimados deben ser un número entero igual o mayor a cero', 'gastos_estimados');
  }
  if (gastos > 2000000000) {
    throw new ValidationError('Los gastos estimados no pueden superar $2.000.000.000', 'gastos_estimados');
  }

  const evento = await prisma.evento.findFirst({
    where: { id_evento, id_dueno: idDueno },
  });
  if (!evento) throw new NotFoundError('El evento no existe');
  if (evento.estado === 'CERRADO') {
    throw new ValidationError('La jornada está cerrada: los gastos estimados ya no pueden cambiarse', 'id_evento');
  }

  if (gastos !== evento.gastos_estimados) {
    await prisma.$transaction([
      prisma.evento.update({ where: { id_evento }, data: { gastos_estimados: gastos } }),
      prisma.historialCambio.create({
        data: {
          tabla_afectada: 'evento',
          dato: `evento #${id_evento}: gastos_estimados`,
          valor_anterior: String(evento.gastos_estimados),
          valor_nuevo: String(gastos),
          motivo: String(motivo ?? '').trim().slice(0, 255) || 'Ajuste de gastos estimados',
          id_dueno: idDueno,
          id_evento,
        },
      }),
    ]);
  }

  return calcularViabilidad(id_evento, idDueno);
}