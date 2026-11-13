import prisma from '../config/prisma.js';
import { NotFoundError } from '../utils/errores.js';

const suma = (r, campo) => r._sum[campo] ?? 0;

export const calcularRentabilidad = async (id_evento, db = prisma) => {
  // 1. Agregamos la consulta para obtener el precio_acordado del evento
  const evento = await db.evento.findUnique({
    where: { id_evento },
    select: { precio_acordado: true }
  });

  const pagos = await db.pagoCliente.aggregate({ _sum: { monto: true }, where: { id_evento } });
  const aportes = await db.cumplimientoAporte.aggregate({ _sum: { monto_recibido: true }, where: { acuerdo: { id_evento } } });
  const remuneraciones = await db.asignacionPersonal.aggregate({ _sum: { remuneracion: true }, where: { id_evento } });
  const gastos = await db.gastoEvento.aggregate({ _sum: { monto: true }, where: { asignacion: { id_evento } } });
  const perdidas = await db.incidente.aggregate({ _sum: { valor: true }, where: { id_evento } });

  const precio_acordado = evento?.precio_acordado || 0;
  const pagos_cliente = suma(pagos, 'monto');
  const aportes_auspiciadores = suma(aportes, 'monto_recibido');
  
  // 2. Cambiamos la fórmula para que el ingreso real sea el precio acordado
  const ingresos = precio_acordado + aportes_auspiciadores;
  
  const total_remuneraciones = suma(remuneraciones, 'remuneracion');
  const total_gastos = suma(gastos, 'monto');
  const perdidas_inventario = suma(perdidas, 'valor');
  const resultado = ingresos - total_remuneraciones - total_gastos - perdidas_inventario;

  return {
    precio_acordado, // Retornamos el precio acordado al frontend
    pagos_cliente,   // Mantenemos pagos_cliente por si necesitas auditar el flujo de caja
    aportes_auspiciadores,
    ingresos,
    remuneraciones: total_remuneraciones,
    gastos: total_gastos,
    perdidas_inventario,
    resultado,
    tipo: resultado < 0 ? 'PERDIDA' : 'GANANCIA',
  };
};

export const obtenerRentabilidad = async (id_evento) => {
  const evento = await prisma.evento.findUnique({ where: { id_evento } });
  if(!evento) throw new NotFoundError('El evento no existe');

  const r = await calcularRentabilidad(id_evento);
  const definitiva = evento.estado === 'CERRADO' && evento.rentabilidad_final !== null;
  const resultado = definitiva ? evento.rentabilidad_final : r.resultado;

  return {
    id_evento,
    estado_evento: evento.estado,
    definitiva,
    ...r,
    resultado,
    tipo: resultado < 0 ? 'PERDIDA' : 'GANANCIA',
  };
};