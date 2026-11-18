import prisma from "../config/prisma.js";
import { recalcularRemuneraciones } from './remuneracion.service.js';
import { validarFormatoAgenda, validarAgendaEvento, aFecha, aHora, hoyTexto } from './validacionesEvento.service.js';
import { ValidationError, NotFoundError } from '../utils/errores.js';

const HORAS_LIMITE_ADELANTO = 5;

// Campos que el Jefe de área técnica no puede ver (RF-P1-11 y RF-T-05)
const CAMPOS_FINANCIEROS = ['precio_acordado', 'gastos_estimados', 'rentabilidad_final'];

export async function listarEventos(usuario) {
  const eventos = await prisma.evento.findMany({
    // Dueño: solo sus eventos. Contador y Jefe no tienen id_dueno: ven los de la empresa
    where: usuario.rol === 'DUENO' ? { id_dueno: usuario.id_dueno } : {},
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

  // Dueño y Contador ven todo; el Jefe técnico recibe los eventos sin datos financieros
  if (usuario.rol !== 'JEFE_TECNICO') return eventos;
  return eventos.map((evento) => {
    const publico = { ...evento };
    CAMPOS_FINANCIEROS.forEach((campo) => delete publico[campo]);
    return publico;
  });
}

export async function crearEvento(datos, idDueno) {
  const tipo = String(datos.tipo ?? "").trim();
  const direccion = String(datos.direccion ?? "").trim();
  const observaciones = String(datos.observaciones ?? "").trim() || null;
  const cantidadCamaras = Number(datos.cantidad_camaras);
  const precio = Number(datos.precio_acordado);
  const idCliente = Number(datos.id_cliente);

  // 1. Validaciones de los datos (las mismas del PUT)
  if (!tipo) throw new ValidationError("Debe indicar el tipo de evento");
  if (tipo.length > 40) throw new ValidationError("El tipo de evento no puede superar los 40 caracteres");
  if (!direccion) throw new ValidationError("Debe indicar la dirección del evento");
  if (direccion.length > 120) throw new ValidationError("La dirección no puede superar los 120 caracteres");
  if (observaciones && observaciones.length > 255) {
    throw new ValidationError("Las observaciones no pueden superar los 255 caracteres");
  }
  if (!Number.isInteger(cantidadCamaras) || cantidadCamaras < 1) {
    throw new ValidationError("Debe indicar al menos 1 cámara");
  }
  if (!Number.isInteger(precio) || precio <= 0) {
    throw new ValidationError("El precio debe ser mayor a cero");
  }
  if (!Number.isInteger(idCliente) || idCliente <= 0) {
    throw new ValidationError("Debe seleccionar un cliente");
  }
  validarFormatoAgenda(datos); // fecha y horas válidas, y término posterior al inicio
  if (datos.fecha < hoyTexto()) throw new ValidationError("La fecha del evento no puede ser anterior a hoy");

  // 2. El cliente debe existir y ser del dueño
  const cliente = await prisma.cliente.findFirst({
    where: { id_cliente: idCliente, id_dueno: idDueno },
  });
  if (!cliente) throw new NotFoundError("El cliente no existe");

  const inicio = new Date(`${datos.fecha}T${datos.hora_inicio}:00Z`);
  const termino = new Date(`${datos.fecha}T${datos.hora_termino}:00Z`);

  // 3. Estado inicial según la duración (RF-P1-04)
  const duracionHoras = (termino - inicio) / (1000 * 60 * 60);
  const estado =
    duracionHoras >= HORAS_LIMITE_ADELANTO
      ? "PENDIENTE_ADELANTO"
      : "CONFIRMADO";

  return prisma.evento.create({
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
      id_dueno: idDueno,
    },
    include: { cliente: true },
  });
}

export async function eliminarEvento(id, motivo, idDueno) {
  const motivoLimpio = String(motivo ?? "").trim();
  if (!motivoLimpio) {
    throw new ValidationError("Debes indicar el motivo de la eliminación");
  }
  if (motivoLimpio.length > 255) {
    throw new ValidationError("El motivo no puede superar los 255 caracteres");
  }

  const evento = await prisma.evento.findFirst({ where: { id_evento: id, id_dueno: idDueno } });
  if (!evento) {
    throw new NotFoundError("El evento no existe");
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
    throw new ValidationError(
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
        id_dueno: idDueno,
      },
    });
    return tx.evento.delete({ where: { id_evento: id } });
  });
}

export const actualizarEvento = async (id, datos, idDueno) => {
  const id_evento = Number(id);
  const tipo = String(datos.tipo ?? "").trim();
  const direccion = String(datos.direccion ?? "").trim();
  const observaciones = String(datos.observaciones ?? "").trim() || null;
  const cantidadCamaras = Number(datos.cantidad_camaras);
  const precio = Number(datos.precio_acordado);
  const idCliente = Number(datos.id_cliente);

  // 1. Validaciones de los datos (las mismas del POST, más largos máximos y fecha/hora reales)
  if (!tipo) throw new ValidationError("Debe indicar el tipo de evento");
  if (tipo.length > 40) throw new ValidationError("El tipo de evento no puede superar los 40 caracteres");
  if (!direccion) throw new ValidationError("Debe indicar la dirección del evento");
  if (direccion.length > 120) throw new ValidationError("La dirección no puede superar los 120 caracteres");
  if (observaciones && observaciones.length > 255) {
    throw new ValidationError("Las observaciones no pueden superar los 255 caracteres");
  }
  if (!Number.isInteger(cantidadCamaras) || cantidadCamaras < 1) {
    throw new ValidationError("Debe indicar al menos 1 cámara");
  }
  if (!Number.isInteger(precio) || precio <= 0) {
    throw new ValidationError("El precio debe ser mayor a cero");
  }
  if (!Number.isInteger(idCliente) || idCliente <= 0) {
    throw new ValidationError("Debe seleccionar un cliente");
  }
  validarFormatoAgenda(datos); // fecha y horas válidas, y término posterior al inicio

  const inicio = new Date(`${datos.fecha}T${datos.hora_inicio}:00Z`);
  const termino = new Date(`${datos.fecha}T${datos.hora_termino}:00Z`);

  // 2. El evento debe existir y no estar cerrado
  const existente = await prisma.evento.findFirst({
    where: { id_evento, id_dueno: idDueno },
  });
  if (!existente) {
    throw new NotFoundError("El evento no existe");
  }
  if (existente.estado === "CERRADO") {
    throw new ValidationError("La jornada está cerrada: el evento ya no puede modificarse");
  }
  // Un evento ya pasado se puede corregir, pero no se puede mover a una fecha pasada
  if (datos.fecha !== aFecha(existente.fecha) && datos.fecha < hoyTexto()) {
    throw new ValidationError("No puedes mover el evento a una fecha anterior a hoy");
  }

  const cliente = await prisma.cliente.findFirst({
    where: { id_cliente: idCliente, id_dueno: idDueno },
  });
  if (!cliente) throw new NotFoundError("El cliente no existe");

  // 3. Agenda, kits y personal: el cambio no puede romper lo ya comprometido
  const advertencias = await validarAgendaEvento(
    existente,
    { fecha: datos.fecha, hora_inicio: datos.hora_inicio, hora_termino: datos.hora_termino, direccion },
    idDueno,
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
          id_dueno: idDueno,
          id_evento,
        })),
      });
    }

    if (precio !== existente.precio_acordado) {
      await recalcularRemuneraciones(id_evento, idDueno, tx);
    }

    return evento;
  });

  return { ...actualizado, advertencias };
};