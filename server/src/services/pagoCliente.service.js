import prisma from '../config/prisma.js';
import { ValidationError, NotFoundError } from '../utils/errores.js';
import { hoyTexto } from './validacionesEvento.service.js';

const TIPOS_PAGO = ['ADELANTO', 'SALDO', 'PAGO_TOTAL'];
const NOMBRE_TIPO = { SALDO: 'saldo', PAGO_TOTAL: 'pago total' };

// Dueño: solo sus eventos. Contador: no tiene id_dueno en el token, ve los eventos de la empresa
async function obtenerEvento(id_evento, db = prisma, idDueno) {
  const evento = await db.evento.findFirst({
    where: { id_evento, ...(idDueno ? { id_dueno: idDueno } : {}) },
  });
  if (!evento) throw new NotFoundError('El evento no existe');
  return evento;
}

// Precio, total pagado, saldo pendiente y, si corresponde, cuánto se pasaron los pagos
const resumen = (evento, totalPagado) => ({
  precio_acordado: evento.precio_acordado,
  total_pagado: totalPagado,
  saldo_pendiente: Math.max(evento.precio_acordado - totalPagado, 0),
  excedente: Math.max(totalPagado - evento.precio_acordado, 0),
});

// ---------- Pagos del evento y saldo pendiente ----------
export async function listarPagos(id_evento, idDueno) {
  const evento = await obtenerEvento(id_evento, prisma, idDueno);

  const pagos = await prisma.pagoCliente.findMany({
    where: { id_evento },
    include: { contador: { select: { nombre: true } } },
    orderBy: [{ fecha: 'desc' }, { id_pago: 'desc' }],
  });
  const total = pagos.reduce((suma, p) => suma + p.monto, 0);

  return {
    id_evento,
    estado_evento: evento.estado,
    ...resumen(evento, total),
    pagos: pagos.map((p) => ({
      id_pago: p.id_pago,
      tipo_pago: p.tipo_pago,
      monto: p.monto,
      fecha: p.fecha,
      medio_pago: p.medio_pago,
      registrado_por: p.contador.nombre,
    })),
  };
}

// ---------- RF-P1-09: registrar un pago + RF-P1-10: confirmar el evento por adelanto ----------
export async function registrarPago(
  id_evento,
  { tipo_pago, monto, fecha, medio_pago, id_contador, confirmar },
) {
  const montoNum = Number(monto);
  const medio = String(medio_pago ?? '').trim();
  const idContador = Number(id_contador);
  const fechaTexto = String(fecha ?? '');

  if (!TIPOS_PAGO.includes(tipo_pago)) {
    throw new ValidationError('El tipo de pago debe ser adelanto, saldo o pago total', 'tipo_pago');
  }
  if (!Number.isInteger(montoNum) || montoNum <= 0) {
    throw new ValidationError('El monto debe ser un número entero mayor a cero', 'monto');
  }
  const fechaValida =
    /^\d{4}-\d{2}-\d{2}$/.test(fechaTexto) &&
    new Date(`${fechaTexto}T00:00:00Z`).toISOString().slice(0, 10) === fechaTexto;
  if (!fechaValida) {
    throw new ValidationError('La fecha no es válida (usa AAAA-MM-DD)', 'fecha');
  }
    if (fechaTexto > hoyTexto()) {
    throw new ValidationError('La fecha del pago no puede ser futura', 'fecha');
  }
  if (!medio) throw new ValidationError('Debes indicar el medio de pago', 'medio_pago');
  if (medio.length > 20) {
    throw new ValidationError('El medio de pago no puede superar los 20 caracteres', 'medio_pago');
  }

  // Todo en una transacción: o se registra el pago (y la confirmación) completo o nada
  return prisma.$transaction(async (tx) => {
    // Bloquea el evento: evita que dos pagos simultáneos descuadren el total
    await tx.$queryRaw`SELECT id_evento FROM evento WHERE id_evento = ${id_evento} FOR UPDATE`;

    const evento = await obtenerEvento(id_evento, tx);
    const { _sum } = await tx.pagoCliente.aggregate({ _sum: { monto: true }, where: { id_evento } });
    const pagadoAntes = _sum.monto ?? 0;
    const pagadoDespues = pagadoAntes + montoNum;

    // Con la jornada cerrada los montos del evento quedan fijos
    if (evento.estado === 'CERRADO') {
      throw new ValidationError('La jornada está cerrada: ya no se pueden registrar pagos', 'id_evento');
    }

    // "Pago total" solo sirve si aún no hay pagos; "saldo" y "pago total" deben cubrir lo que falta
    const saldo = Math.max(evento.precio_acordado - pagadoAntes, 0);
    if (tipo_pago === 'PAGO_TOTAL' && pagadoAntes > 0) {
      throw new ValidationError('Ya hay pagos registrados: registra el resto como "Saldo"', 'tipo_pago');
    }
    if (tipo_pago !== 'ADELANTO' && montoNum < saldo) {
      throw new ValidationError(
        `Un pago de tipo ${NOMBRE_TIPO[tipo_pago]} debe cubrir el saldo pendiente de $${saldo}`,
        'monto',
      );
    }

    // Advertencia: los pagos superan el precio (no bloquea, pide confirmar)
    if (pagadoDespues > evento.precio_acordado && !confirmar) {
      return {
        registrado: false,
        advertencia: {
          precio_acordado: evento.precio_acordado,
          pagado_antes: pagadoAntes,
          monto: montoNum,
          excedente: pagadoDespues - evento.precio_acordado,
        },
      };
    }

    const pago = await tx.pagoCliente.create({
      data: {
        tipo_pago,
        monto: montoNum,
        fecha: new Date(fechaTexto),
        medio_pago: medio,
        id_evento,
        id_contador: idContador,
      },
    });

    await tx.historialCambio.create({
      data: {
        tabla_afectada: 'pago_cliente',
        dato: `evento #${id_evento}: pago del cliente`,
        valor_nuevo: `${tipo_pago} ${montoNum}`,
        motivo: pagadoDespues > evento.precio_acordado ? 'Los pagos superan el precio acordado' : null,
        id_contador: idContador,
        id_evento,
      },
    });

    // RF-P1-10: con al menos el 50% del precio pagado, "Pendiente de adelanto" pasa a "Confirmado"
    let eventoConfirmado = false;
    if (evento.estado === 'PENDIENTE_ADELANTO' && pagadoDespues * 2 >= evento.precio_acordado) {
      await tx.evento.update({ where: { id_evento }, data: { estado: 'CONFIRMADO' } });
      await tx.historialCambio.create({
        data: {
          tabla_afectada: 'evento',
          dato: `evento #${id_evento}: estado`,
          valor_anterior: 'PENDIENTE_ADELANTO',
          valor_nuevo: 'CONFIRMADO',
          motivo: 'Adelanto del 50% recibido',
          id_contador: idContador,
          id_evento,
        },
      });
      eventoConfirmado = true;
    }

    return {
      registrado: true,
      id_pago: pago.id_pago,
      evento_confirmado: eventoConfirmado,
      estado_evento: eventoConfirmado ? 'CONFIRMADO' : evento.estado,
      ...resumen(evento, pagadoDespues),
    };
  });
}