import prisma from '../config/prisma.js';
import { ValidationError, NotFoundError } from '../utils/errores.js';

const suma = (r, campo) => r._sum[campo] ?? 0;

// Pagos del cliente + aportes cumplidos − remuneraciones − gastos − pérdidas de inventario
const calcularResultado = async (db, id_evento) => {
  const pagos = await db.pagoCliente.aggregate({ _sum: { monto: true }, where: { id_evento } });
  const aportes = await db.cumplimientoAporte.aggregate({ _sum: { monto_recibido: true }, where: { acuerdo: { id_evento } } });
  const remuneraciones = await db.asignacionPersonal.aggregate({ _sum: { remuneracion: true }, where: { id_evento } });
  const gastos = await db.gastoEvento.aggregate({ _sum: { monto: true }, where: { asignacion: { id_evento } } });
  const perdidas = await db.incidente.aggregate({ _sum: { valor: true }, where: { id_evento } });

  const ingresos = suma(pagos, 'monto') + suma(aportes, 'monto_recibido');
  const costos = suma(remuneraciones, 'remuneracion') + suma(gastos, 'monto') + suma(perdidas, 'valor');

  return {
    ingresos,
    remuneraciones: suma(remuneraciones, 'remuneracion'),
    gastos: suma(gastos, 'monto'),
    perdidas_inventario: suma(perdidas, 'valor'),
    resultado: ingresos - costos,
    tipo: ingresos - costos < 0 ? 'PERDIDA' : 'GANANCIA',
  };
};

// Qué impide cerrar (bloqueos) y qué conviene avisar (advertencias)
const revisar = async (db, id_evento) => {
  const evento = await db.evento.findUnique({ where: { id_evento } });
  if(!evento) throw new NotFoundError('El evento no existe');

  const asignaciones = await db.asignacionPersonal.findMany({
    where: { id_evento },
    include: { trabajador: { select: { nombre: true } } },
  });
  const sinPorcentaje = asignaciones.filter((a) => a.porcentaje === null).map((a) => a.trabajador.nombre);
  const pendientes = asignaciones
    .filter((a) => !a.estado_rendicion || a.estado_rendicion === 'PENDIENTE')
    .map((a) => a.trabajador.nombre);

  // Kits que salieron para este evento y todavía no vuelven
  const salidas = await db.salidaKit.findMany({
    where: { reserva: { id_evento }, fecha_hora_retorno: null },
    include: { reserva: { include: { kit: { select: { nombre: true } } } } },
  });
  const kits = salidas.map((s) => s.reserva.kit.nombre);

  const bloqueos = [];
  if(evento.estado !== 'REALIZADO') bloqueos.push('Solo se puede cerrar la jornada de un evento REALIZADO');
  if(sinPorcentaje.length > 0) bloqueos.push(`Faltan porcentajes por definir: ${sinPorcentaje.join(', ')}`);

  const advertencias = [];
  if(pendientes.length > 0) advertencias.push({ tipo: 'RENDICIONES_PENDIENTES', detalle: pendientes });
  if(kits.length > 0) advertencias.push({ tipo: 'KITS_SIN_RETORNO', detalle: kits });

  return { evento, sinPorcentaje, bloqueos, advertencias };
};

// Revisión previa: qué falta y cómo va el resultado
export const revisarCierre = async (id_evento) => {
  const { evento, sinPorcentaje, bloqueos, advertencias } = await revisar(prisma, id_evento);
  return {
    estado_evento: evento.estado,
    puede_cerrar: bloqueos.length === 0,
    sin_porcentaje: sinPorcentaje,
    advertencias,
    resultado: await calcularResultado(prisma, id_evento),
  };
};

// RF-P7-08: cerrar la jornada
export const cerrarJornada = (id_evento, id_dueno, confirmar) =>
  prisma.$transaction(async (tx) => {
    // Bloquea el evento: no se cruza con un cambio de porcentaje, gasto o rendición
    await tx.$queryRaw`SELECT id_evento FROM evento WHERE id_evento = ${id_evento} FOR UPDATE`;

    const { bloqueos, advertencias } = await revisar(tx, id_evento);
    if(bloqueos.length > 0) throw new ValidationError(bloqueos.join('. '), 'id_evento');

    // Con advertencias, solo se cierra si el Dueño confirma
    if(advertencias.length > 0 && !confirmar) return { cerrado: false, advertencias };

    const resultado = await calcularResultado(tx, id_evento);
    await tx.evento.update({
      where: { id_evento },
      data: { estado: 'CERRADO', fecha_cierre: new Date(), rentabilidad_final: resultado.resultado },
    });

    // RF-T-06: cambio de estado y rentabilidad fijada
    await tx.historialCambio.createMany({
      data: [
        { tabla_afectada: 'evento', dato: `evento #${id_evento}: estado`, valor_anterior: 'REALIZADO', valor_nuevo: 'CERRADO', id_dueno, id_evento },
        { tabla_afectada: 'evento', dato: `evento #${id_evento}: rentabilidad_final`, valor_nuevo: String(resultado.resultado), id_dueno, id_evento },
      ],
    });

    return { cerrado: true, resultado };
  });