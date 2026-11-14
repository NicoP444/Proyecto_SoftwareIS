import prisma from '../config/prisma.js';
import { ValidationError, NotFoundError } from '../utils/errores.js';

const FECHA = /^\d{4}-\d{2}-\d{2}$/; // AAAA-MM-DD
const HORA = /^\d{2}:\d{2}$/; // HH:MM

// Las fechas y horas de Prisma vienen como Date: las pasamos a texto para compararlas fácil
const aHora = (d) => d.toISOString().slice(11, 16); // "09:00"
const aFecha = (d) => d.toISOString().slice(0, 10); // "2026-11-10"

// Dos franjas se traslapan si una empieza antes de que la otra termine (y al revés)
const seTraslapan = (iniA, finA, iniB, finB) => iniA < finB && finA > iniB;

// "09:30" -> 570 (minutos desde la medianoche), para poder restar horas
const aMinutos = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

// Deja la dirección sin tildes, mayúsculas, puntuación ni espacios repetidos
const normalizar = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Dos eventos están en el mismo lugar si la dirección normalizada es igual
const mismaDireccion = (a, b) => normalizar(a) === normalizar(b);

// ¿Algún bloque de disponibilidad del trabajador cubre la fecha del evento?
// La disponibilidad se define solo por rango de fechas (fecha_inicio – fecha_termino), sin horas.
const cubreFecha = (bloques, fecha) =>
  bloques.some((b) => aFecha(b.fecha_inicio) <= fecha && aFecha(b.fecha_termino) >= fecha);

// Valida fecha y horas que vienen por la URL (RF-P1-03)
const validarFranja = ({ fecha, hora_inicio, hora_termino }) => {
  if (!FECHA.test(fecha ?? '')) throw new ValidationError('La fecha no es válida', 'fecha');
  if (!HORA.test(hora_inicio ?? '')) throw new ValidationError('La hora de inicio no es válida', 'hora_inicio');
  if (!HORA.test(hora_termino ?? '')) throw new ValidationError('La hora de término no es válida', 'hora_termino');
  if (hora_termino <= hora_inicio) {
    throw new ValidationError('La hora de término debe ser posterior a la de inicio', 'hora_termino');
  }
};

// ---------- RF-P1-03: personal disponible para una fecha y horario ----------
// Disponible = activo + tiene un bloque de disponibilidad que cubre la franja
// + no está asignado a otro evento que se traslape. Solo lee, no modifica nada.
export const listarPersonalDisponible = async ({ id_dueno, fecha, hora_inicio, hora_termino, id_rol, id_evento }) => {
  validarFranja({ fecha, hora_inicio, hora_termino });

  // Si estamos asignando a un evento, quienes ya están en él no se vuelven a ofrecer
  const yaEnElEvento = id_evento
    ? (await prisma.asignacionPersonal.findMany({ where: { id_evento }, select: { id_trabajador: true } })).map(
        (a) => a.id_trabajador,
      )
    : [];

  const trabajadores = await prisma.trabajador.findMany({
    where: {
      id_dueno,
      estado: 'ACTIVO',
      id_trabajador: { notIn: yaEnElEvento },
      ...(id_rol ? { roles: { some: { id_rol } } } : {}),
    },
    include: {
      roles: { select: { rol: { select: { id_rol: true, nombre: true, estado: true } } } },
      disponibilidades: true,
      // Solo sus asignaciones de ese día (los eventos son de un solo día)
      asignaciones: {
        where: { evento: { fecha: new Date(`${fecha}T00:00:00Z`) } },
        include: { evento: { select: { hora_inicio: true, hora_termino: true } } },
      },
    },
    orderBy: { nombre: 'asc' },
  });

  return trabajadores
    .filter((t) => {
      const ocupado = t.asignaciones.some((a) =>
        seTraslapan(hora_inicio, hora_termino, aHora(a.evento.hora_inicio), aHora(a.evento.hora_termino)),
      );
      return !ocupado && cubreFecha(t.disponibilidades, fecha);
    })
    .map((t) => ({
      id_trabajador: t.id_trabajador,
      nombre: t.nombre,
      telefono_whatsapp: t.telefono_whatsapp,
      rol_fijo: t.rol_fijo,
      roles: t.roles.filter((r) => r.rol.estado === 'ACTIVO').map((r) => ({ id_rol: r.rol.id_rol, nombre: r.rol.nombre })),
    }));
};

// ---------- Todo el personal, con su estado para una franja opcional ----------
// Sin franja: lista a todos. Con franja (fecha + horas): a cada persona activa
// le agrega si está DISPONIBLE, OCUPADO (en otro evento) o SIN_DISPONIBILIDAD.
export const listarPersonalConEstado = async ({ id_dueno, fecha, hora_inicio, hora_termino }) => {
  const hayFranja = Boolean(fecha || hora_inicio || hora_termino);
  if (hayFranja) validarFranja({ fecha, hora_inicio, hora_termino });

  const trabajadores = await prisma.trabajador.findMany({
    where: { id_dueno },
    include: {
      roles: { select: { rol: { select: { id_rol: true, nombre: true, estado: true } } } },
      disponibilidades: true,
      ...(hayFranja
        ? {
            asignaciones: {
              where: { evento: { fecha: new Date(`${fecha}T00:00:00Z`) } },
              include: { evento: { select: { tipo: true, hora_inicio: true, hora_termino: true } } },
            },
          }
        : {}),
    },
    orderBy: { nombre: 'asc' },
  });

  return trabajadores.map((t) => {
    let estado_franja = null;
    let detalle = null;

    // Solo tiene sentido evaluar la franja de quienes están activos
    if (hayFranja && t.estado === 'ACTIVO') {
      const choque = t.asignaciones.find((a) =>
        seTraslapan(hora_inicio, hora_termino, aHora(a.evento.hora_inicio), aHora(a.evento.hora_termino)),
      );
      if (choque) {
        estado_franja = 'OCUPADO';
        detalle = `En "${choque.evento.tipo}" (${aHora(choque.evento.hora_inicio)}–${aHora(choque.evento.hora_termino)})`;
      } else if (!cubreFecha(t.disponibilidades, fecha)) {
        estado_franja = 'SIN_DISPONIBILIDAD';
      } else {
        estado_franja = 'DISPONIBLE';
      }
    }

    return {
      id_trabajador: t.id_trabajador,
      nombre: t.nombre,
      telefono_whatsapp: t.telefono_whatsapp,
      rol_fijo: t.rol_fijo,
      estado_cuenta: t.estado, // ACTIVO, LICENCIA o INACTIVO
      estado_franja,
      detalle,
      roles: t.roles.filter((r) => r.rol.estado === 'ACTIVO').map((r) => ({ id_rol: r.rol.id_rol, nombre: r.rol.nombre })),
    };
  });
};

// ---------- Trabajadores asignados a un evento ----------
export const listarAsignaciones = async (id_evento) => {
  const evento = await prisma.evento.findUnique({ where: { id_evento } });
  if (!evento) throw new NotFoundError('El evento no existe');

  return prisma.asignacionPersonal.findMany({
    where: { id_evento },
    select: {
      id_asignacion: true,
      id_trabajador: true,
      id_rol: true,
      trabajador: { select: { nombre: true, telefono_whatsapp: true } },
      rol: { select: { nombre: true } },
    },
    orderBy: { id_asignacion: 'asc' },
  });
};

// ---------- RF-P3-01: asignar un trabajador a un evento con un rol ----------
export const asignarTrabajador = async (id_evento, { id_trabajador, id_rol, id_dueno }) => {
  id_trabajador = Number(id_trabajador);
  id_rol = Number(id_rol);
  if (!Number.isInteger(id_trabajador) || id_trabajador <= 0) {
    throw new ValidationError('Debes elegir un trabajador', 'id_trabajador');
  }
  if (!Number.isInteger(id_rol) || id_rol <= 0) {
    throw new ValidationError('Debes elegir un rol', 'id_rol');
  }

  const evento = await prisma.evento.findUnique({ where: { id_evento } });
  if (!evento) throw new NotFoundError('El evento no existe');
  if (evento.estado === 'CERRADO') {
    throw new ValidationError('La jornada está cerrada: ya no se puede cambiar la dotación', 'id_evento');
  }

  const trabajador = await prisma.trabajador.findFirst({
    where: { id_trabajador, id_dueno },
    include: { roles: true, disponibilidades: true },
  });
  if (!trabajador) throw new NotFoundError('El trabajador no existe');
  if (trabajador.estado !== 'ACTIVO') throw new ValidationError('El trabajador no está activo', 'id_trabajador');

  const rol = await prisma.rolTrabajo.findFirst({ where: { id_rol, id_dueno } });
  if (!rol) throw new NotFoundError('El rol no existe');
  if (rol.estado !== 'ACTIVO') throw new ValidationError('El rol está desactivado', 'id_rol');

  // Solo roles que la persona sabe desempeñar
  if (!trabajador.roles.some((r) => r.id_rol === id_rol)) {
    throw new ValidationError(`${trabajador.nombre} no sabe desempeñar el rol ${rol.nombre}`, 'id_rol');
  }

  const yaAsignado = await prisma.asignacionPersonal.findUnique({
    where: { id_evento_id_trabajador: { id_evento, id_trabajador } },
  });
  if (yaAsignado) throw new ValidationError(`${trabajador.nombre} ya está asignado a este evento`, 'id_trabajador');

  // No puede estar en otro evento que se traslape
  const horaIni = aHora(evento.hora_inicio);
  const horaFin = aHora(evento.hora_termino);
  const otras = await prisma.asignacionPersonal.findMany({
    where: { id_trabajador, id_evento: { not: id_evento }, evento: { fecha: evento.fecha } },
    include: { evento: true },
  });
  const choque = otras.find((a) =>
    seTraslapan(horaIni, horaFin, aHora(a.evento.hora_inicio), aHora(a.evento.hora_termino)),
  );
  if (choque) {
    throw new ValidationError(
      `${trabajador.nombre} ya está asignado a "${choque.evento.tipo}" (${aHora(choque.evento.hora_inicio)}–${aHora(choque.evento.hora_termino)}) y se traslapa con este evento`,
      'id_trabajador',
    );
  }

  const advertencias = [];

  // Fuera de su disponibilidad (rango de fechas): se permite, pero se avisa
  if (!cubreFecha(trabajador.disponibilidades, aFecha(evento.fecha))) {
    advertencias.push(`${trabajador.nombre} queda fuera de su disponibilidad registrada para esa fecha`);
  }

  // Margen de traslado (RF-P3-02): otro evento el mismo día en otra dirección, con poco tiempo entre ambos
  const { margen_traslado_min } = await prisma.dueno.findUnique({
    where: { id_dueno },
    select: { margen_traslado_min: true },
  });
  for (const a of otras) {
    if (mismaDireccion(a.evento.direccion, evento.direccion)) continue;
    const iniOtro = aMinutos(aHora(a.evento.hora_inicio));
    const finOtro = aMinutos(aHora(a.evento.hora_termino));
    // Ya sabemos que no se traslapan: el tiempo libre es lo que separa un evento del otro
    const espera = finOtro <= aMinutos(horaIni) ? aMinutos(horaIni) - finOtro : iniOtro - aMinutos(horaFin);
    if (espera < margen_traslado_min) {
      advertencias.push(
        `Entre este evento y "${a.evento.tipo}" hay solo ${espera} min y están en direcciones distintas (el margen de traslado es de ${margen_traslado_min} min)`,
      );
    }
  }

  const asignacion = await prisma.asignacionPersonal.create({
    data: { id_evento, id_trabajador, id_rol, id_dueno },
    select: {
      id_asignacion: true,
      id_trabajador: true,
      id_rol: true,
      trabajador: { select: { nombre: true, telefono_whatsapp: true } },
      rol: { select: { nombre: true } },
    },
  });

  return { asignacion, advertencias };
};

// ---------- Quitar a un trabajador del evento (cuando cambia la dotación) ----------
export const quitarAsignacion = async (id_evento, id_asignacion) => {
  const asignacion = await prisma.asignacionPersonal.findFirst({
    where: { id_asignacion, id_evento },
    include: {
      evento: true,
      trabajador: { select: { nombre: true } },
      _count: { select: { gastos: true, pagos_remuneracion: true, salidas_a_cargo: true } },
    },
  });
  if (!asignacion) throw new NotFoundError('La asignación no existe');
  if (asignacion.evento.estado === 'CERRADO') {
    throw new ValidationError('La jornada está cerrada: ya no se puede cambiar la dotación', 'id_evento');
  }

  // Si ya tiene movimientos registrados, quitarlo dejaría datos huérfanos
  const bloqueos = [];
  if (asignacion._count.gastos > 0) bloqueos.push('gastos registrados');
  if (asignacion._count.pagos_remuneracion > 0) bloqueos.push('pagos de remuneración');
  if (asignacion._count.salidas_a_cargo > 0) bloqueos.push('kits a su cargo');
  if (bloqueos.length > 0) {
    throw new ValidationError(`No se puede quitar a ${asignacion.trabajador.nombre}: tiene ${bloqueos.join(', ')}`, 'id_asignacion');
  }

  await prisma.asignacionPersonal.delete({ where: { id_asignacion } });
};