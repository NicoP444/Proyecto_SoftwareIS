import prisma from '../config/prisma.js';
import { NotFoundError } from '../utils/errores.js';

// RF-P7-11: eventos en que participó un trabajador (solo lectura)
export const historialDeTrabajador = async (id_trabajador) => {
  const trabajador = await prisma.trabajador.findUnique({
    where: { id_trabajador },
    select: { id_trabajador: true, nombre: true, estado: true },
  });
  if(!trabajador) throw new NotFoundError('El trabajador no existe');

  // "Participó" = el evento ya se realizó (o está cerrado), el más reciente primero
  const asignaciones = await prisma.asignacionPersonal.findMany({
    where: { id_trabajador, evento: { estado: { in: ['REALIZADO', 'CERRADO'] } } },
    include: {
      evento: { include: { cliente: { select: { nombre: true } } } },
      rol: { select: { nombre: true } },
      pagos_remuneracion: { orderBy: { id_pago_rem: 'desc' }, take: 1 },
    },
    orderBy: { evento: { fecha: 'desc' } },
  });

  const eventos = asignaciones.map((a) => ({
    id_asignacion: a.id_asignacion,
    id_evento: a.id_evento,
    fecha: a.evento.fecha,
    tipo: a.evento.tipo,
    cliente: a.evento.cliente.nombre,
    estado_evento: a.evento.estado,
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
  }));

  return {
    trabajador,
    eventos,
    resumen: {
      eventos: eventos.length,
      total_remuneracion: eventos.reduce((suma, e) => suma + (e.remuneracion ?? 0), 0),
      por_pagar: eventos
        .filter((e) => e.estado_pago === 'POR_PAGAR')
        .reduce((suma, e) => suma + (e.remuneracion ?? 0), 0),
    },
  };
};