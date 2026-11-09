import prisma from '../config/prisma.js';
import { ValidationError, NotFoundError } from '../utils/errores.js';

// Estados en los que se pueden definir porcentajes: "después de realizada la transmisión
// y antes de cerrar la jornada". Si el equipo decide permitirlos antes, agrega 'CONFIRMADO'.
const ESTADOS_EDITABLES = ['REALIZADO'];

// Los porcentajes se comparan en centésimas (12.5% -> 1250) para evitar errores de decimales
const aCentesimas = (valor) => Math.round(Number(valor ?? 0) * 100);
const aNumero = (valor) => (valor === null || valor === undefined ? null : Number(valor));

// RF-P7-07: monto = porcentaje × precio, redondeado al peso (medio peso sube), con aritmética entera
export const calcularMonto = (porcentaje, precio) =>
  Math.floor((aCentesimas(porcentaje) * precio + 5000) / 10000);

// ---------- Panel del evento: porcentaje y monto de cada trabajador + lo que queda para la empresa ----------
export const listarPorEvento = async (id_evento) => {
  const evento = await prisma.evento.findUnique({ where: { id_evento } });
  if(!evento) throw new NotFoundError('El evento no existe');

  const asignaciones = await prisma.asignacionPersonal.findMany({
    where: { id_evento },
    include: {
      trabajador: { select: { nombre: true } },
      rol: { select: { nombre: true, porcentaje_referencial: true } },
    },
    orderBy: { id_asignacion: 'asc' },
  });

  const totalCent = asignaciones.reduce((suma, a) => suma + aCentesimas(a.porcentaje), 0);
  const repartido = asignaciones.reduce((suma, a) => suma + (a.remuneracion ?? 0), 0);

  return {
    id_evento,
    estado_evento: evento.estado,
    precio_acordado: evento.precio_acordado,
    editable: ESTADOS_EDITABLES.includes(evento.estado),
    asignaciones: asignaciones.map((a) => ({
      id_asignacion: a.id_asignacion,
      id_trabajador: a.id_trabajador,
      trabajador: a.trabajador.nombre,
      id_rol: a.id_rol,
      rol: a.rol.nombre,
      porcentaje_referencial: aNumero(a.rol.porcentaje_referencial), // RF-P7-06: el front lo propone
      porcentaje: aNumero(a.porcentaje),
      remuneracion: a.remuneracion,
    })),
    resumen: {
      total_porcentaje: totalCent / 100,
      total_repartido: repartido,
      queda_empresa_porcentaje: (10000 - totalCent) / 100,
      queda_empresa_monto: evento.precio_acordado - repartido,
      sin_porcentaje: asignaciones.filter((a) => a.porcentaje === null).length,
    },
  };
};

// ---------- RF-P7-05 + RF-P7-07: definir el porcentaje de un trabajador y calcular su remuneración ----------
export const definirPorcentaje = async (id_asignacion, { id_dueno, porcentaje, motivo }) => {
  return prisma.$transaction(async (tx) => {
    const asignacion = await tx.asignacionPersonal.findUnique({
      where: { id_asignacion },
      include: { evento: true, trabajador: { select: { nombre: true } } },
    });
    if(!asignacion) throw new NotFoundError('La asignación no existe');
    const evento = asignacion.evento;

    // Bloquea el evento: evita que dos cambios simultáneos superen el 100%
    await tx.$queryRaw`SELECT id_evento FROM evento WHERE id_evento = ${evento.id_evento} FOR UPDATE`;

    if(evento.estado === 'CERRADO'){
      throw new ValidationError('La jornada está cerrada: los porcentajes ya no pueden cambiarse', 'id_asignacion');
    }
    if(!ESTADOS_EDITABLES.includes(evento.estado)){
      throw new ValidationError('Solo se puede definir el porcentaje de eventos en estado REALIZADO', 'id_asignacion');
    }

    // La suma del evento no puede superar 100% (sin contar la fila que se está editando)
    const otras = await tx.asignacionPersonal.findMany({
      where: { id_evento: evento.id_evento, NOT: { id_asignacion } },
      select: { porcentaje: true, remuneracion: true },
    });
    const otrasCent = otras.reduce((suma, o) => suma + aCentesimas(o.porcentaje), 0);
    const otrasMonto = otras.reduce((suma, o) => suma + (o.remuneracion ?? 0), 0);
    const nuevoCent = aCentesimas(porcentaje);

    if(otrasCent + nuevoCent > 10000){
      const disponible = (10000 - otrasCent) / 100;
      throw new ValidationError(
        `La suma de porcentajes del evento no puede superar 100%. Máximo para este trabajador: ${disponible}%`,
        'porcentaje',
      );
    }

    const remuneracion = calcularMonto(porcentaje, evento.precio_acordado);
    const porcentajeAnterior = aNumero(asignacion.porcentaje);

    if(porcentajeAnterior !== porcentaje || asignacion.remuneracion !== remuneracion){
      await tx.asignacionPersonal.update({
        where: { id_asignacion },
        data: { porcentaje, remuneracion },
      });

      // RF-T-06: historial de cambios de montos
      const base = { tabla_afectada: 'asignacion_personal', motivo, id_dueno, id_evento: evento.id_evento };
      const filas = [];
      if(porcentajeAnterior !== porcentaje){
        filas.push({
          ...base,
          dato: `asignación #${id_asignacion}: porcentaje`,
          valor_anterior: porcentajeAnterior === null ? null : String(porcentajeAnterior),
          valor_nuevo: String(porcentaje),
        });
      }
      if(asignacion.remuneracion !== remuneracion){
        filas.push({
          ...base,
          dato: `asignación #${id_asignacion}: remuneración`,
          valor_anterior: asignacion.remuneracion === null ? null : String(asignacion.remuneracion),
          valor_nuevo: String(remuneracion),
        });
      }
      await tx.historialCambio.createMany({ data: filas });
    }

    return {
      id_asignacion,
      id_evento: evento.id_evento,
      id_trabajador: asignacion.id_trabajador,
      trabajador: asignacion.trabajador.nombre,
      porcentaje,
      remuneracion,
      total_porcentaje_evento: (otrasCent + nuevoCent) / 100,
      queda_empresa_porcentaje: (10000 - otrasCent - nuevoCent) / 100,
      queda_empresa_monto: evento.precio_acordado - otrasMonto - remuneracion,
    };
  });
};

// ---------- RF-P7-07: recalcular las remuneraciones cuando cambia el PRECIO del evento ----------
const ejecutarRecalculo = async (tx, id_evento, id_dueno) => {
  // Bloquea el evento para no cruzarse con un cambio de porcentaje simultáneo
  await tx.$queryRaw`SELECT id_evento FROM evento WHERE id_evento = ${id_evento} FOR UPDATE`;

  const evento = await tx.evento.findUnique({ where: { id_evento } });
  if(!evento) throw new NotFoundError('El evento no existe');
  if(evento.estado === 'CERRADO') return 0; // desde el cierre solo corrige el Contador

  // Solo las asignaciones que ya tienen porcentaje
  const asignaciones = await tx.asignacionPersonal.findMany({
    where: { id_evento, porcentaje: { not: null } },
  });

  const filas = [];
  for(const a of asignaciones){
    const nueva = calcularMonto(a.porcentaje, evento.precio_acordado);
    if(nueva === a.remuneracion) continue;

    await tx.asignacionPersonal.update({
      where: { id_asignacion: a.id_asignacion },
      data: { remuneracion: nueva },
    });
    filas.push({
      tabla_afectada: 'asignacion_personal',
      dato: `asignación #${a.id_asignacion}: remuneración`,
      valor_anterior: a.remuneracion === null ? null : String(a.remuneracion),
      valor_nuevo: String(nueva),
      motivo: 'Recálculo por cambio de precio del evento',
      id_dueno,
      id_evento,
    });
  }

  if(filas.length > 0) await tx.historialCambio.createMany({ data: filas });
  return filas.length;
};

// La llama el módulo de eventos (evento.service.js) con su transacción: (id_evento, id_dueno, tx)
export const recalcularRemuneraciones = (id_evento, id_dueno, tx = null) =>
  tx
    ? ejecutarRecalculo(tx, id_evento, id_dueno)
    : prisma.$transaction((t) => ejecutarRecalculo(t, id_evento, id_dueno));