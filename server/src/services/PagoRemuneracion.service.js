import prisma from '../config/prisma.js';
import { ValidationError, NotFoundError } from '../utils/errores.js';

// Lista del evento: cada trabajador con su remuneración, su estado de pago y el pago registrado
export const listarPorEvento = async (id_evento) => {
  const evento = await prisma.evento.findUnique({ where: { id_evento } });
  if(!evento) throw new NotFoundError('El evento no existe');

  const asignaciones = await prisma.asignacionPersonal.findMany({
    where: { id_evento },
    include: {
      trabajador: { select: { nombre: true } },
      rol: { select: { nombre: true } },
      pagos_remuneracion: { orderBy: { id_pago_rem: 'desc' }, take: 1 },
    },
    orderBy: { id_asignacion: 'asc' },
  });

  const porPagar = asignaciones.filter((a) => a.estado_pago === 'POR_PAGAR');

  return {
    id_evento,
    estado_evento: evento.estado,
    puede_pagar: evento.estado === 'CERRADO',
    pagos: asignaciones.map((a) => ({
      id_asignacion: a.id_asignacion,
      id_trabajador: a.id_trabajador,
      trabajador: a.trabajador.nombre,
      rol: a.rol.nombre,
      remuneracion: a.remuneracion,
      estado_pago: a.estado_pago,
      pago: a.pagos_remuneracion[0]
        ? {
            fecha: a.pagos_remuneracion[0].fecha,
            monto: a.pagos_remuneracion[0].monto,
            medio_pago: a.pagos_remuneracion[0].medio_pago,
          }
        : null,
    })),
    resumen: {
      por_pagar: porPagar.length,
      pagadas: asignaciones.length - porPagar.length,
      monto_por_pagar: porPagar.reduce((suma, a) => suma + (a.remuneracion ?? 0), 0),
    },
  };
};

// RF-P7-10: registrar el pago y dejar la remuneración como "Pagada"
export const registrarPago = async (id_asignacion, { id_contador, fecha, monto, medio_pago, confirmar }) => {
  const asignacion = await prisma.asignacionPersonal.findUnique({
    where: { id_asignacion },
    include: { evento: true, trabajador: { select: { nombre: true } } },
  });
  if(!asignacion) throw new NotFoundError('La asignación no existe');

  if(asignacion.evento.estado !== 'CERRADO'){
    throw new ValidationError('Solo se puede registrar el pago cuando la jornada está cerrada', 'id_asignacion');
  }
  if(!asignacion.remuneracion){
    throw new ValidationError('El trabajador no tiene una remuneración que pagar', 'id_asignacion');
  }
  if(asignacion.estado_pago === 'PAGADA'){
    throw new ValidationError('La remuneración ya está pagada', 'id_asignacion');
  }

  // Advertencia: el monto pagado difiere del calculado (no bloquea, pide confirmar)
  const calculado = asignacion.remuneracion;
  const diferencia = monto - calculado;
  if(diferencia !== 0 && !confirmar){
    return { registrado: false, advertencia: { calculado, monto, diferencia } };
  }

  await prisma.$transaction(async (tx) => {
    // Solo pasa de POR_PAGAR a PAGADA una vez, aunque lleguen dos solicitudes a la vez
    const marcada = await tx.asignacionPersonal.updateMany({
      where: { id_asignacion, estado_pago: 'POR_PAGAR' },
      data: { estado_pago: 'PAGADA' },
    });
    if(marcada.count === 0){
      throw new ValidationError('La remuneración ya está pagada', 'id_asignacion');
    }

    await tx.pagoRemuneracion.create({
      data: { fecha, monto, medio_pago, id_asignacion, id_contador },
    });

    // RF-T-06: el pago queda en el historial
    await tx.historialCambio.create({
      data: {
        tabla_afectada: 'pago_remuneracion',
        dato: `asignación #${id_asignacion}: pago de remuneración`,
        valor_nuevo: String(monto),
        motivo: diferencia !== 0 ? `Difiere del monto calculado (${calculado})` : null,
        id_contador,
        id_evento: asignacion.id_evento,
      },
    });
  });

  return {
    registrado: true,
    id_asignacion,
    trabajador: asignacion.trabajador.nombre,
    calculado,
    monto,
    diferencia,
    estado_pago: 'PAGADA',
  };
};