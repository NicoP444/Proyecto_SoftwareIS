import prisma from "../config/prisma.js";
import { ValidationError, NotFoundError } from "../utils/errores.js";

// Las horas de Prisma vienen como Date: las pasamos a texto ("09:00") para compararlas fácil
const aHora = (d) => d.toISOString().slice(11, 16);
const aMinutos = (hhmm) =>
  Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

// Dos franjas se traslapan si una empieza antes de que la otra termine (y al revés)
const seTraslapan = (iniA, finA, iniB, finB) => iniA < finB && finA > iniB;

// Deja la dirección sin tildes, mayúsculas, puntuación ni espacios repetidos
const normalizar = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const mismaDireccion = (a, b) => normalizar(a) === normalizar(b);

async function obtenerEvento(id_evento, id_dueno) {
  const evento = await prisma.evento.findFirst({
    where: { id_evento, ...(id_dueno ? { id_dueno } : {}) },
  });
  if (!evento) throw new NotFoundError("El evento no existe");
  return evento;
}

// Reservas de esos kits en OTROS eventos del mismo día
const reservasDelDia = (evento, ids_kit) =>
  prisma.reservaKit.findMany({
    where: {
      id_kit: { in: ids_kit },
      id_evento: { not: evento.id_evento },
      evento: { fecha: evento.fecha },
    },
    include: {
      kit: { select: { nombre: true } },
      evento: {
        select: {
          tipo: true,
          hora_inicio: true,
          hora_termino: true,
          direccion: true,
        },
      },
    },
  });

const chocaConEvento = (evento, otro) =>
  seTraslapan(
    aHora(evento.hora_inicio),
    aHora(evento.hora_termino),
    aHora(otro.hora_inicio),
    aHora(otro.hora_termino),
  );

// ---------- Kits que ya tiene el evento ----------
export const listarKitsEvento = async (id_evento, id_dueno) => {
  await obtenerEvento(id_evento, id_dueno);
  return prisma.reservaKit.findMany({
    where: { id_evento },
    select: {
      id_reserva: true,
      id_kit: true,
      kit: { select: { nombre: true, nivel: true, estado: true } },
      salida: { select: { id_salida: true } },
    },
    orderBy: { id_reserva: "asc" },
  });
};

// ---------- RF-P1-05: kits para asignar, con su estado para el horario del evento ----------
// Se listan TODOS los kits que aún no tiene el evento (igual que el personal):
//  - DISPONIBLE: completo y libre a esa hora.
//  - EN_TERRENO: salió a otro evento y no registra retorno; se puede asignar, con aviso.
//  - OCUPADO: reservado en otro evento que se traslapa; no se puede.
//  - INCOMPLETO: le falta equipo operativo; no se puede.
const CATEGORIAS_MINIMAS = ["CAMARA", "TRIPODE", "MICROFONO", "SWITCH_VIDEO"];
const NOMBRE_CATEGORIA = {
  CAMARA: "cámara",
  TRIPODE: "trípode",
  MICROFONO: "micrófono",
  SWITCH_VIDEO: "switch de video",
};

export const listarKitsDisponibles = async (id_evento, id_dueno) => {
  const evento = await obtenerEvento(id_evento, id_dueno);

  const yaEnElEvento = (
    await prisma.reservaKit.findMany({
      where: { id_evento },
      select: { id_kit: true },
    })
  ).map((r) => r.id_kit);

  const kits = await prisma.kit.findMany({
    where: { id_kit: { notIn: yaEnElEvento } },
    select: {
      id_kit: true,
      nombre: true,
      nivel: true,
      estado: true,
      equipos: {
        select: { codigo: true, categoria: true, estado: true },
        orderBy: { codigo: "asc" },
      },
    },
    orderBy: { nombre: "asc" },
  });

  const otras = await reservasDelDia(
    evento,
    kits.map((k) => k.id_kit),
  );
  const choques = new Map();
  for (const o of otras) {
    if (chocaConEvento(evento, o.evento) && !choques.has(o.id_kit))
      choques.set(o.id_kit, o.evento);
  }

  return kits.map((k) => {
    let estado_franja = "DISPONIBLE";
    let motivo = null;
    if (k.estado === "INCOMPLETO") {
      const operativas = new Set(
        k.equipos
          .filter((e) => e.estado === "OPERATIVO")
          .map((e) => e.categoria),
      );
      const faltan = CATEGORIAS_MINIMAS.filter((c) => !operativas.has(c)).map(
        (c) => NOMBRE_CATEGORIA[c],
      );
      estado_franja = "INCOMPLETO";
      motivo = faltan.length
        ? `Le falta equipo operativo: ${faltan.join(", ")}`
        : "Le falta equipo operativo";
    } else if (choques.has(k.id_kit)) {
      const otro = choques.get(k.id_kit);
      estado_franja = "OCUPADO";
      motivo = `Ocupado en "${otro.tipo}" (${aHora(otro.hora_inicio)}–${aHora(otro.hora_termino)})`;
    } else if (k.estado === "EN_TERRENO") {
      estado_franja = "EN_TERRENO";
      motivo =
        "Salió a otro evento y aún no registra su retorno: se puede asignar, con aviso";
    }
    return {
      ...k,
      estado_franja,
      motivo,
      disponible:
        estado_franja === "DISPONIBLE" || estado_franja === "EN_TERRENO",
    };
  });
};

// ---------- RF-P1-05: reservar un kit para el evento ----------
export const reservarKit = async (id_evento, { id_kit, id_dueno }) => {
  id_kit = Number(id_kit);
  if (!Number.isInteger(id_kit) || id_kit <= 0) {
    throw new ValidationError("Debes elegir un kit", "id_kit");
  }

  const evento = await obtenerEvento(id_evento, id_dueno);
  if (evento.estado === "CERRADO") {
    throw new ValidationError(
      "La jornada está cerrada: ya no se pueden cambiar los kits",
      "id_evento",
    );
  }

  const kit = await prisma.kit.findUnique({ where: { id_kit } });
  if (!kit) throw new NotFoundError("El kit no existe");
  if (kit.estado === "INCOMPLETO") {
    throw new ValidationError(
      `El "${kit.nombre}" está incompleto y no se puede asignar`,
      "id_kit",
    );
  }

  const yaReservado = await prisma.reservaKit.findUnique({
    where: { id_evento_id_kit: { id_evento, id_kit } },
  });
  if (yaReservado)
    throw new ValidationError(
      `El kit "${kit.nombre}" ya está asignado a este evento`,
      "id_kit",
    );

  // No puede estar comprometido en otro evento que se traslape: se informa con cuál choca
  const otras = await reservasDelDia(evento, [id_kit]);
  const choque = otras.find((o) => chocaConEvento(evento, o.evento));
  if (choque) {
    throw new ValidationError(
      `El kit "${kit.nombre}" ya está reservado para "${choque.evento.tipo}" (${aHora(choque.evento.hora_inicio)}–${aHora(choque.evento.hora_termino)}) y se traslapa con este evento`,
      "id_kit",
    );
  }

  const advertencias = [];
  // Un kit que salió a terreno y aún no vuelve podría no estar libre a tiempo
  if (kit.estado === "EN_TERRENO") {
    advertencias.push(
      `El kit "${kit.nombre}" figura En terreno y aún no registra su retorno`,
    );
  }

  // Margen de traslado (RF-P3-02): otro evento el mismo día en otra dirección, con poco tiempo entre ambos
  const { margen_traslado_min } = await prisma.dueno.findUnique({
    where: { id_dueno },
    select: { margen_traslado_min: true },
  });
  const iniEvento = aMinutos(aHora(evento.hora_inicio));
  const finEvento = aMinutos(aHora(evento.hora_termino));
  for (const o of otras) {
    if (mismaDireccion(o.evento.direccion, evento.direccion)) continue;
    const iniOtro = aMinutos(aHora(o.evento.hora_inicio));
    const finOtro = aMinutos(aHora(o.evento.hora_termino));
    // Ya sabemos que no se traslapan: el tiempo libre es lo que separa un evento del otro
    const espera =
      finOtro <= iniEvento ? iniEvento - finOtro : iniOtro - finEvento;
    if (espera < margen_traslado_min) {
      advertencias.push(
        `Entre este evento y "${o.evento.tipo}" hay solo ${espera} min y están en direcciones distintas (el margen de traslado es de ${margen_traslado_min} min)`,
      );
    }
  }

  // La reserva y su registro en el historial van juntos
  const reserva = await prisma.$transaction(async (tx) => {
    const creada = await tx.reservaKit.create({
      data: { id_evento, id_kit, id_dueno },
      select: {
        id_reserva: true,
        id_kit: true,
        kit: { select: { nombre: true, nivel: true, estado: true } },
      },
    });

    // RF-P1-07: el cambio de kits queda en el historial del evento
    await tx.historialCambio.create({
      data: {
        tabla_afectada: "reserva_kit",
        dato: `evento #${id_evento}: kit`,
        valor_nuevo: creada.kit.nombre.slice(0, 255),
        motivo: "Kit asignado al evento",
        id_dueno,
        id_evento,
      },
    });

    return creada;
  });

  return { reserva, advertencias };
};

// ---------- Quitar un kit del evento ----------
export const quitarKit = async (id_evento, id_reserva, id_dueno) => {
  const reserva = await prisma.reservaKit.findFirst({
    where: { id_reserva, id_evento, id_dueno },
    include: {
      evento: true,
      kit: { select: { nombre: true } },
      salida: { select: { id_salida: true } },
    },
  });
  if (!reserva) throw new NotFoundError("La reserva no existe");
  if (reserva.evento.estado === "CERRADO") {
    throw new ValidationError(
      "La jornada está cerrada: ya no se pueden cambiar los kits",
      "id_evento",
    );
  }
  // Si el kit ya salió a terreno, quitarlo dejaría la salida huérfana
  if (reserva.salida) {
    throw new ValidationError(
      `No se puede quitar el kit "${reserva.kit.nombre}": ya registró su salida`,
      "id_reserva",
    );
  }

  // Quitar y registrar en el historial van juntos
  await prisma.$transaction([
    prisma.reservaKit.delete({ where: { id_reserva } }),
    prisma.historialCambio.create({
      data: {
        tabla_afectada: "reserva_kit",
        dato: `evento #${id_evento}: kit`,
        valor_anterior: reserva.kit.nombre.slice(0, 255),
        motivo: "Kit quitado del evento",
        id_dueno,
        id_evento,
      },
    }),
  ]);
};