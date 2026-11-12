import prisma from "../config/prisma.js";
import { recalcularRemuneraciones } from './remuneracion.service.js';
import { validarFormatoAgenda, validarAgendaEvento, aFecha, aHora } from './validacionesEvento.service.js';

const ID_DUENO_DEMO = 1;
const HORAS_LIMITE_ADELANTO = 5;

export async function listarEventos() {
  return prisma.evento.findMany({
    where: { id_dueno: ID_DUENO_DEMO },
    include: {
      cliente: true,
      asignaciones: {
        select: {
          id_asignacion: true,
          trabajador: { select: { nombre: true } },
          rol: { select: { nombre: true } }
        }
      },
      reservas_kit: {
        select: { id_reserva: true, kit: { select: { nombre: true } } }
      },
      acuerdos: {
        select: { id_acuerdo: true, auspiciador: { select: { nombre: true } } }
      },
      incidentes: {
        select: { id_incidente: true, tipo: true, descripcion: true }
      }
    },
    orderBy: [{ fecha: 'asc' }, { hora_inicio: 'asc' }]
  });
}

export async function crearEvento(datos) {
  const cantidadCamaras = Number(datos.cantidad_camaras);
  const precio = Number(datos.precio_acordado);
  const idCliente = Number(datos.id_cliente);

  if (!datos.direccion || !datos.direccion.trim()) {
    throw new Error("Debe indicar la dirección del evento");
  }
  if (!Number.isInteger(cantidadCamaras) || cantidadCamaras < 1) {
    throw new Error("Debe indicar al menos 1 cámara");
  }
  if (!Number.isInteger(precio) || precio <= 0) {
    throw new Error("El precio debe ser mayor a cero");
  }
  if (!Number.isInteger(idCliente) || idCliente <= 0) {
    throw new Error("Debe seleccionar un cliente");
  }

  const inicio = new Date(`${datos.fecha}T${datos.hora_inicio}:00Z`);
  const termino = new Date(`${datos.fecha}T${datos.hora_termino}:00Z`);

  if (termino <= inicio) {
    throw new Error(
      "La hora de término debe ser posterior a la hora de inicio",
    );
  }

  const duracionHoras = (termino - inicio) / (1000 * 60 * 60);
  const estado =
    duracionHoras >= HORAS_LIMITE_ADELANTO
      ? "PENDIENTE_ADELANTO"
      : "CONFIRMADO";

  return prisma.evento.create({
    data: {
      tipo: datos.tipo,
      fecha: new Date(datos.fecha),
      hora_inicio: inicio,
      hora_termino: termino,
      direccion: datos.direccion,
      cantidad_camaras: cantidadCamaras,
      precio_acordado: precio,
      observaciones: datos.observaciones || null,
      estado,
      id_cliente: idCliente,
      id_dueno: ID_DUENO_DEMO,
    },
    include: { cliente: true },
  });
}

export async function eliminarEvento(id, motivo) {
  const motivoLimpio = String(motivo ?? "").trim();
  if (!motivoLimpio) {
    throw new Error("Debes indicar el motivo de la eliminación");
  }
  if (motivoLimpio.length > 255) {
    throw new Error("El motivo no puede superar los 255 caracteres");
  }

  const evento = await prisma.evento.findUnique({ where: { id_evento: id } });
  if (!evento) {
    throw new Error("El evento no existe");
  }

  // Cuenta todo lo que impide eliminar el evento
  const [pagos, gastos, aportes, incidentes, salidas, remuneraciones] =
    await Promise.all([
      prisma.pagoCliente.count({ where: { id_evento: id } }),
      prisma.gastoEvento.count({ where: { asignacion: { id_evento: id } } }),
      prisma.acuerdoAuspicio.count({ where: { id_evento: id } }),
      prisma.incidente.count({ where: { id_evento: id } }),
      prisma.salidaKit.count({ where: { reserva: { id_evento: id } } }),
      prisma.pagoRemuneracion.count({
        where: { asignacion: { id_evento: id } },
      }),
    ]);

  // Armamos el motivo con todo lo que corresponda
  const motivos = [];
  if (pagos > 0) motivos.push("pagos del cliente");
  if (gastos > 0) motivos.push("gastos");
  if (aportes > 0) motivos.push("aportes de auspiciadores");
  if (incidentes > 0) motivos.push("incidentes");
  if (salidas > 0) motivos.push("salidas de kits");
  if (remuneraciones > 0) motivos.push("pagos de remuneraciones");

  if (motivos.length > 0) {
    throw new Error(
      `No se puede eliminar: el evento tiene ${motivos.join(", ")} registrados`,
    );
  }

  // Todo en una transacción: o se hace completo o no se hace nada
  return prisma.$transaction(async (tx) => {
    // Libera a los trabajadores y a los kits del evento
    await tx.asignacionPersonal.deleteMany({ where: { id_evento: id } });
    await tx.reservaKit.deleteMany({ where: { id_evento: id } });

    // El historial se conserva, pero ya sin apuntar al evento borrado
    await tx.historialCambio.updateMany({
      where: { id_evento: id },
      data: { id_evento: null },
    });

        // Dejamos registrado quién/por qué se eliminó (id_evento queda null porque el evento ya no existe)
    await tx.historialCambio.create({
      data: {
        tabla_afectada: "evento",
        dato: `evento #${id}: eliminado`,
        valor_anterior: `${evento.tipo} - ${evento.fecha.toISOString().slice(0, 10)}`,
        motivo: motivoLimpio,
        id_dueno: ID_DUENO_DEMO,
      },
    });
    return tx.evento.delete({ where: { id_evento: id } });
  });
}

export const actualizarEvento = async (id, datos) => {
  const id_evento = Number(id);
  const tipo = String(datos.tipo ?? "").trim();
  const direccion = String(datos.direccion ?? "").trim();
  const observaciones = String(datos.observaciones ?? "").trim() || null;
  const cantidadCamaras = Number(datos.cantidad_camaras);
  const precio = Number(datos.precio_acordado);
  const idCliente = Number(datos.id_cliente);

  // 1. Validaciones de los datos (las mismas del POST, más largos máximos y fecha/hora reales)
  if (!tipo) throw new Error("Debe indicar el tipo de evento");
  if (tipo.length > 40) throw new Error("El tipo de evento no puede superar los 40 caracteres");
  if (!direccion) throw new Error("Debe indicar la dirección del evento");
  if (direccion.length > 120) throw new Error("La dirección no puede superar los 120 caracteres");
  if (observaciones && observaciones.length > 255) {
    throw new Error("Las observaciones no pueden superar los 255 caracteres");
  }
  if (!Number.isInteger(cantidadCamaras) || cantidadCamaras < 1) {
    throw new Error("Debe indicar al menos 1 cámara");
  }
  if (!Number.isInteger(precio) || precio <= 0) {
    throw new Error("El precio debe ser mayor a cero");
  }
  if (!Number.isInteger(idCliente) || idCliente <= 0) {
    throw new Error("Debe seleccionar un cliente");
  }
  validarFormatoAgenda(datos); // fecha y horas válidas, y término posterior al inicio

  const inicio = new Date(`${datos.fecha}T${datos.hora_inicio}:00Z`);
  const termino = new Date(`${datos.fecha}T${datos.hora_termino}:00Z`);

  // 2. El evento debe existir y no estar cerrado
  const existente = await prisma.evento.findFirst({
    where: { id_evento, id_dueno: ID_DUENO_DEMO },
  });
  if (!existente) {
    throw new Error("El evento no existe");
  }
  if (existente.estado === "CERRADO") {
    throw new Error("La jornada está cerrada: el evento ya no puede modificarse");
  }

  const cliente = await prisma.cliente.findFirst({
    where: { id_cliente: idCliente, id_dueno: ID_DUENO_DEMO },
  });
  if (!cliente) {
    throw new Error("El cliente no existe");
  }

  // 3. Agenda, kits y personal: el cambio no puede romper lo ya comprometido
  const advertencias = await validarAgendaEvento(
    existente,
    { fecha: datos.fecha, hora_inicio: datos.hora_inicio, hora_termino: datos.hora_termino, direccion },
    ID_DUENO_DEMO,
  );

  // 4. Estado: solo se recalcula si el evento no tiene pagos
  const pagos = await prisma.pagoCliente.count({ where: { id_evento } });
  const duracionHoras = (termino - inicio) / (1000 * 60 * 60);
  const estadoRecalculable = ["PENDIENTE_ADELANTO", "CONFIRMADO"].includes(existente.estado);
  const estado =
    pagos > 0 || !estadoRecalculable
      ? existente.estado
      : duracionHoras >= HORAS_LIMITE_ADELANTO
        ? "PENDIENTE_ADELANTO"
        : "CONFIRMADO";

  // 5. Qué cambió realmente (cada cambio queda en el historial)
  const texto = (v) => (v === null || v === undefined || v === "" ? null : String(v).slice(0, 255));
  const cambios = [
    ["tipo", existente.tipo, tipo],
    ["fecha", aFecha(existente.fecha), datos.fecha],
    ["hora_inicio", aHora(existente.hora_inicio), datos.hora_inicio],
    ["hora_termino", aHora(existente.hora_termino), datos.hora_termino],
    ["direccion", existente.direccion, direccion],
    ["cantidad_camaras", existente.cantidad_camaras, cantidadCamaras],
    ["precio_acordado", existente.precio_acordado, precio],
    ["id_cliente", existente.id_cliente, idCliente],
    ["observaciones", existente.observaciones, observaciones],
    ["estado", existente.estado, estado],
  ].filter(([, antes, despues]) => texto(antes) !== texto(despues));

  const motivo = String(datos.motivo ?? "").trim().slice(0, 255) || "Modificación del evento";

  // 6. Actualizar + historial + remuneraciones en la misma transacción: o se hace todo o nada
  const actualizado = await prisma.$transaction(async (tx) => {
    const evento = await tx.evento.update({
      where: { id_evento },
      data: {
        tipo,
        fecha: new Date(datos.fecha),
        hora_inicio: inicio,
        hora_termino: termino,
        direccion,
        cantidad_camaras: cantidadCamaras,
        precio_acordado: precio,
        observaciones,
        estado,
        id_cliente: idCliente,
      },
      include: { cliente: true },
    });

    if (cambios.length > 0) {
      await tx.historialCambio.createMany({
        data: cambios.map(([campo, antes, despues]) => ({
          tabla_afectada: "evento",
          dato: `evento #${id_evento}: ${campo}`,
          valor_anterior: texto(antes),
          valor_nuevo: texto(despues),
          motivo,
          id_dueno: ID_DUENO_DEMO,
          id_evento,
        })),
      });
    }

    if (precio !== existente.precio_acordado) {
      await recalcularRemuneraciones(id_evento, ID_DUENO_DEMO, tx);
    }

    return evento;
  });

  return { ...actualizado, advertencias };
};