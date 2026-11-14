import prisma from '../config/prisma.js';

// Validaciones al MODIFICAR un evento (RF-P1-07): agenda, kits y personal.
// Solo leen la base de datos: si algo no se puede, lanzan un Error; si algo solo hay que revisar, lo devuelven como advertencia.

const FECHA = /^\d{4}-\d{2}-\d{2}$/; // AAAA-MM-DD
const HORA = /^\d{2}:\d{2}$/; // HH:MM

// Prisma entrega fechas y horas como Date: las pasamos a texto para compararlas fácil
export const aHora = (d) => d.toISOString().slice(11, 16); // "09:00"
export const aFecha = (d) => d.toISOString().slice(0, 10); // "2026-11-10"
const aMinutos = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

// Dos franjas se traslapan si una empieza antes de que la otra termine (y al revés)
const seTraslapan = (iniA, finA, iniB, finB) => iniA < finB && finA > iniB;

// Deja la dirección sin tildes, mayúsculas, puntuación ni espacios repetidos
const normalizar = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const mismaDireccion = (a, b) => normalizar(a) === normalizar(b);

// ¿Algún bloque de disponibilidad del trabajador cubre la fecha del evento?
// La disponibilidad se define solo por rango de fechas, sin horas.
const cubreFecha = (bloques, fecha) =>
  bloques.some((b) => aFecha(b.fecha_inicio) <= fecha && aFecha(b.fecha_termino) >= fecha);

// ---------- Agenda: la fecha y las horas deben existir y tener sentido ----------
export function validarFormatoAgenda({ fecha, hora_inicio, hora_termino }) {
  const fechaValida =
    FECHA.test(fecha ?? '') && new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) === fecha; // evita "2026-02-31"
  if (!fechaValida) throw new Error('La fecha no es válida (usa AAAA-MM-DD)');

  for (const [nombre, hora] of [['inicio', hora_inicio], ['término', hora_termino]]) {
    const ok = HORA.test(hora ?? '') && !Number.isNaN(new Date(`2000-01-01T${hora}:00Z`).getTime());
    if (!ok) throw new Error(`La hora de ${nombre} no es válida (usa HH:MM)`);
  }
  if (hora_termino <= hora_inicio) {
    throw new Error('La hora de término debe ser posterior a la hora de inicio');
  }
}

/**
 * Revisa que el cambio de fecha, horario o dirección no rompa kits ni personal ya comprometidos.
 *  evento = el evento tal como está hoy en la base de datos
 *  nueva  = { fecha: 'AAAA-MM-DD', hora_inicio: 'HH:MM', hora_termino: 'HH:MM', direccion }
 * Devuelve una lista de advertencias (puede estar vacía). Lanza Error si hay un choque que impide guardar.
 */
export async function validarAgendaEvento(evento, nueva, id_dueno) {
  const advertencias = [];

  const cambioHorario =
    nueva.fecha !== aFecha(evento.fecha) ||
    nueva.hora_inicio !== aHora(evento.hora_inicio) ||
    nueva.hora_termino !== aHora(evento.hora_termino);
  const cambioDireccion = !mismaDireccion(nueva.direccion, evento.direccion);

  // Si no cambió ni el horario ni el lugar, la agenda sigue igual: no hay nada que revisar
  if (!cambioHorario && !cambioDireccion) return advertencias;

  const fechaDia = new Date(`${nueva.fecha}T00:00:00Z`);

  // Margen de traslado (RF-P3-02): vale para personas y para kits
  const { margen_traslado_min } = await prisma.dueno.findUnique({
    where: { id_dueno },
    select: { margen_traslado_min: true },
  });

  // Minutos libres entre este evento (con la franja nueva) y otro evento del mismo día
  const minutosEntre = (otro) => {
    const iniOtro = aMinutos(aHora(otro.hora_inicio));
    const finOtro = aMinutos(aHora(otro.hora_termino));
    return finOtro <= aMinutos(nueva.hora_inicio) ? aMinutos(nueva.hora_inicio) - finOtro : iniOtro - aMinutos(nueva.hora_termino);
  };

  // ---------- Kits reservados (RF-P1-05) ----------
  const reservas = await prisma.reservaKit.findMany({
    where: { id_evento: evento.id_evento },
    include: {
      kit: { select: { nombre: true, estado: true } },
      salida: { select: { fecha_hora_retorno: true } },
    },
  });

  if (cambioHorario) {
    // Un kit que ya salió a terreno y no ha vuelto no puede quedar atado a otro horario
    const enTerreno = reservas.find((r) => r.salida && !r.salida.fecha_hora_retorno);
    if (enTerreno) {
      throw new Error(
        `No se puede cambiar la fecha ni el horario: el kit "${enTerreno.kit.nombre}" ya salió a terreno y aún no vuelve`,
      );
    }
  }

  if (reservas.length > 0) {
    // Otras reservas de esos mismos kits el día del evento
    const otrasReservas = await prisma.reservaKit.findMany({
      where: {
        id_kit: { in: reservas.map((r) => r.id_kit) },
        id_evento: { not: evento.id_evento },
        evento: { fecha: fechaDia },
      },
      include: {
        kit: { select: { nombre: true } },
        evento: { select: { tipo: true, hora_inicio: true, hora_termino: true, direccion: true } },
      },
    });
    const seTraslapaConNuevo = (o) =>
      seTraslapan(nueva.hora_inicio, nueva.hora_termino, aHora(o.evento.hora_inicio), aHora(o.evento.hora_termino));

    // Ningún kit reservado puede estar en otro evento que se traslape con el nuevo horario
    if (cambioHorario) {
      const choqueKit = otrasReservas.find(seTraslapaConNuevo);
      if (choqueKit) {
        throw new Error(
          `El kit "${choqueKit.kit.nombre}" ya está reservado para "${choqueKit.evento.tipo}" (${aHora(choqueKit.evento.hora_inicio)}–${aHora(choqueKit.evento.hora_termino)}) y se traslapa con el nuevo horario`,
        );
      }
    }

    // Solo se asignan kits completos: si alguno quedó incompleto, se avisa
    for (const r of reservas) {
      if (r.kit.estado === 'INCOMPLETO') {
        advertencias.push(`El kit "${r.kit.nombre}" figura incompleto`);
      }
    }

    // Margen de traslado de los kits: otro evento ese día en otra dirección con poco tiempo entre ambos
    for (const o of otrasReservas) {
      if (seTraslapaConNuevo(o) || mismaDireccion(o.evento.direccion, nueva.direccion)) continue;
      const espera = minutosEntre(o.evento);
      if (espera < margen_traslado_min) {
        advertencias.push(
          `Kit "${o.kit.nombre}": entre este evento y "${o.evento.tipo}" hay solo ${espera} min y están en direcciones distintas (el margen de traslado es de ${margen_traslado_min} min)`,
        );
      }
    }
  }

  // ---------- Personal asignado (RF-P3-01) ----------
  const asignaciones = await prisma.asignacionPersonal.findMany({
    where: { id_evento: evento.id_evento },
    include: { trabajador: { select: { nombre: true, disponibilidades: true } } },
  });
  if (asignaciones.length === 0) return advertencias;

  // Los demás eventos de esos trabajadores el día del evento
  const otras = await prisma.asignacionPersonal.findMany({
    where: {
      id_trabajador: { in: asignaciones.map((a) => a.id_trabajador) },
      id_evento: { not: evento.id_evento },
      evento: { fecha: fechaDia },
    },
    include: { evento: true },
  });

  for (const a of asignaciones) {
    const nombre = a.trabajador.nombre;
    const susOtras = otras.filter((o) => o.id_trabajador === a.id_trabajador);

    // No puede quedar en dos eventos al mismo tiempo (esto sí impide guardar)
    const choque = susOtras.find((o) =>
      seTraslapan(nueva.hora_inicio, nueva.hora_termino, aHora(o.evento.hora_inicio), aHora(o.evento.hora_termino)),
    );
    if (choque) {
      throw new Error(
        `${nombre} ya está asignado a "${choque.evento.tipo}" (${aHora(choque.evento.hora_inicio)}–${aHora(choque.evento.hora_termino)}) y se traslapa con el nuevo horario. Quítalo del evento o elige otro horario`,
      );
    }

        // Fuera de su disponibilidad registrada (rango de fechas): se permite, pero se avisa
    if (!cubreFecha(a.trabajador.disponibilidades, nueva.fecha)) {
      advertencias.push(`${nombre} queda fuera de su disponibilidad registrada para esa fecha`);
    }

    // Margen de traslado: otro evento ese día en otra dirección con poco tiempo entre ambos
    for (const o of susOtras) {
      if (mismaDireccion(o.evento.direccion, nueva.direccion)) continue;
      const espera = minutosEntre(o.evento);
      if (espera < margen_traslado_min) {
        advertencias.push(
          `${nombre}: entre este evento y "${o.evento.tipo}" hay solo ${espera} min y están en direcciones distintas (el margen de traslado es de ${margen_traslado_min} min)`,
        );
      }
    }
  }

  return advertencias;
}