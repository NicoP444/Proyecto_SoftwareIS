import prisma from '../config/prisma.js';

// Recalcula rentabilidad_final de un evento si ya estaba calculada o cerrado
const recalcularRentabilidadEvento = async (tx, id_evento) => {
  if (!id_evento) return null;

  const evento = await tx.evento.findUnique({
    where: { id_evento },
    select: { id_evento: true, estado: true, rentabilidad_final: true },
  });
  if (!evento) return null;

  const [pagos, aportes, gastos, remun, incidentes] = await Promise.all([
    tx.pagoCliente.aggregate({
      where: { id_evento },
      _sum: { monto: true },
    }),
    tx.cumplimientoAporte.aggregate({
      where: { acuerdo: { id_evento } },
      _sum: { monto_recibido: true },
    }),
    tx.gastoEvento.aggregate({
      where: { asignacion: { id_evento } },
      _sum: { monto: true },
    }),
    tx.pagoRemuneracion.aggregate({
      where: { asignacion: { id_evento } },
      _sum: { monto: true },
    }),
    tx.incidente.aggregate({
      where: { id_evento },
      _sum: { valor: true },
    }),
  ]);

  const ingresosTotales =
    Number(pagos._sum.monto || 0) + Number(aportes._sum.monto_recibido || 0);
  const egresosTotales =
    Number(gastos._sum.monto || 0) +
    Number(remun._sum.monto || 0) +
    Number(incidentes._sum.valor || 0);

  const nuevaRentabilidad = ingresosTotales - egresosTotales;

  if (evento.rentabilidad_final !== null || evento.estado === 'CERRADO') {
    await tx.evento.update({
      where: { id_evento },
      data: { rentabilidad_final: nuevaRentabilidad },
    });
  }

  return nuevaRentabilidad;
};

// Lista todos los registros financieros del mes cerrado + el historial de correcciones
export const obtenerDetalleCorreccionMesService = async ({ anio, mes }) => {
  const mesContable = await prisma.mesContable.findUnique({
    where: { anio_mes: { anio, mes } },
  });

  if (!mesContable || mesContable.estado !== 'CERRADO') {
    return {
      mes_cerrado: false,
      registros: [],
      historial: [],
    };
  }

  const fechaInicio = new Date(Date.UTC(anio, mes - 1, 1));
  const fechaFin = new Date(Date.UTC(anio, mes, 1));

  const [pagosCliente, aportes, remuneraciones, gastosEventos, gastosFijos] =
    await Promise.all([
      prisma.pagoCliente.findMany({
        where: { fecha: { gte: fechaInicio, lt: fechaFin } },
        include: { evento: { select: { id_evento: true, tipo: true } } },
      }),
      prisma.cumplimientoAporte.findMany({
        where: { fecha: { gte: fechaInicio, lt: fechaFin } },
        include: {
          acuerdo: {
            select: {
              id_acuerdo: true,
              glosa: true,
              id_evento: true,
              evento: { select: { tipo: true } },
            },
          },
        },
      }),
      prisma.pagoRemuneracion.findMany({
        where: { fecha: { gte: fechaInicio, lt: fechaFin } },
        include: {
          asignacion: {
            select: {
              id_evento: true,
              trabajador: { select: { nombre: true } },
              evento: { select: { tipo: true } },
            },
          },
        },
      }),
      prisma.gastoEvento.findMany({
        where: { fecha: { gte: fechaInicio, lt: fechaFin } },
        include: {
          asignacion: {
            select: {
              id_evento: true,
              evento: { select: { tipo: true } },
            },
          },
        },
      }),
      prisma.gastoFijo.findMany({
        where: { id_mes: mesContable.id_mes },
      }),
    ]);

  const registros = [
    ...pagosCliente.map((p) => ({
      clave: `pago_cliente:${p.id_pago}`,
      tabla: 'pago_cliente',
      id_registro: String(p.id_pago),
      categoria: 'Ingreso Cliente',
      detalle: `${p.tipo_pago} · Evento #${p.id_evento} (${p.evento?.tipo || ''})`,
      monto: Number(p.monto),
      id_evento: p.id_evento,
    })),
    ...aportes.map((a) => ({
      clave: `cumplimiento_aporte:${a.id_acuerdo}-${a.nro_cumplimiento}`,
      tabla: 'cumplimiento_aporte',
      id_registro: `${a.id_acuerdo}-${a.nro_cumplimiento}`,
      categoria: 'Aporte Auspiciador',
      detalle: `${a.acuerdo?.glosa || 'Acuerdo'} (Cuota #${a.nro_cumplimiento})`,
      monto: Number(a.monto_recibido),
      id_evento: a.acuerdo?.id_evento || null,
    })),
    ...remuneraciones.map((r) => ({
      clave: `pago_remuneracion:${r.id_pago_rem}`,
      tabla: 'pago_remuneracion',
      id_registro: String(r.id_pago_rem),
      categoria: 'Remuneración',
      detalle: `${r.asignacion?.trabajador?.nombre || 'Trabajador'} · Evento #${r.asignacion?.id_evento}`,
      monto: Number(r.monto),
      id_evento: r.asignacion?.id_evento || null,
    })),
    ...gastosEventos.map((g) => ({
      clave: `gasto_evento:${g.id_gasto}`,
      tabla: 'gasto_evento',
      id_registro: String(g.id_gasto),
      categoria: 'Gasto de Evento',
      detalle: `${g.tipo_gasto}${g.descripcion ? ` (${g.descripcion})` : ''} · Evento #${g.asignacion?.id_evento}`,
      monto: Number(g.monto),
      id_evento: g.asignacion?.id_evento || null,
    })),
    ...gastosFijos.map((gf) => ({
      clave: `gasto_fijo:${gf.id_gasto_fijo}`,
      tabla: 'gasto_fijo',
      id_registro: String(gf.id_gasto_fijo),
      categoria: 'Gasto Fijo Mensual',
      detalle: gf.descripcion,
      monto: Number(gf.monto),
      id_evento: null,
    })),
  ];

  // Historial de correcciones realizadas sobre este período
  const historial = await prisma.historialCambio.findMany({
    where: {
      tabla_afectada: {
        in: [
          'pago_cliente',
          'cumplimiento_aporte',
          'pago_remuneracion',
          'gasto_evento',
          'gasto_fijo',
        ],
      },
      fecha_hora: { gte: mesContable.fecha_cierre || fechaInicio },
    },
    include: {
      contador: { select: { nombre: true } },
    },
    orderBy: { fecha_hora: 'desc' },
  });

  return {
    mes_cerrado: true,
    registros,
    historial: historial.map((h) => ({
      id_cambio: h.id_cambio,
      fecha_hora: h.fecha_hora,
      tabla_afectada: h.tabla_afectada,
      dato: h.dato,
      valor_anterior: h.valor_anterior,
      valor_nuevo: h.valor_nuevo,
      motivo: h.motivo,
      contador: h.contador?.nombre || 'Contador',
      id_evento: h.id_evento,
    })),
  };
};

// Ejecuta la corrección auditada y recalcula evento + mes cerrado (RF-P8-06)
export const corregirMontoMesCerradoService = async ({
  anio,
  mes,
  tabla,
  id_registro,
  nuevo_monto,
  motivo,
  id_contador,
}) => {
  const montoNum = Number(nuevo_monto);
  if (!Number.isInteger(montoNum) || montoNum < 0) {
    const err = new Error('El nuevo monto debe ser un número entero mayor o igual a 0.');
    err.status = 400;
    throw err;
  }

  if (!motivo || !motivo.trim()) {
    const err = new Error('Debe ingresar un motivo obligatorio para corregir un mes cerrado.');
    err.status = 400;
    throw err;
  }

  const contadorId = Number(id_contador);
  if (!Number.isInteger(contadorId) || contadorId <= 0) {
    const err = new Error('No se encontró un perfil de Contador válido para auditar el cambio.');
    err.status = 400;
    throw err;
  }

  const mesContable = await prisma.mesContable.findUnique({
    where: { anio_mes: { anio, mes } },
  });

  if (!mesContable || mesContable.estado !== 'CERRADO') {
    const err = new Error('Solo se pueden aplicar correcciones auditadas sobre un mes cerrado.');
    err.status = 400;
    throw err;
  }

  const fechaInicio = new Date(Date.UTC(anio, mes - 1, 1));
  const fechaFin = new Date(Date.UTC(anio, mes, 1));

  return await prisma.$transaction(async (tx) => {
    const enMes = (f) => f >= fechaInicio && f < fechaFin;
    let valorAnterior = 0;
    let idEventoAfectado = null;
    let etiquetaDato = '';

    if (tabla === 'pago_cliente') {
      const reg = await tx.pagoCliente.findUnique({ where: { id_pago: Number(id_registro) } });
      if (!reg) throw Object.assign(new Error('Pago de cliente no encontrado.'), { status: 404 });
      if (!enMes(reg.fecha)) throw Object.assign(new Error('El registro no pertenece al mes seleccionado.'), { status: 400 });
      valorAnterior = reg.monto;
      idEventoAfectado = reg.id_evento;
      etiquetaDato = `Pago cliente #${reg.id_pago} (${reg.tipo_pago})`;
      await tx.pagoCliente.update({
        where: { id_pago: reg.id_pago },
        data: { monto: montoNum },
      });
    } else if (tabla === 'cumplimiento_aporte') {
      const [idAcuerdoStr, nroStr] = String(id_registro).split('-');
      const id_acuerdo = Number(idAcuerdoStr);
      const nro_cumplimiento = Number(nroStr);
      const reg = await tx.cumplimientoAporte.findUnique({
        where: { id_acuerdo_nro_cumplimiento: { id_acuerdo, nro_cumplimiento } },
        include: { acuerdo: { select: { id_evento: true, glosa: true } } },
      });
      if (!reg) throw Object.assign(new Error('Cumplimiento de aporte no encontrado.'), { status: 404 });
      if (!enMes(reg.fecha)) throw Object.assign(new Error('El registro no pertenece al mes seleccionado.'), { status: 400 });
      valorAnterior = reg.monto_recibido;
      idEventoAfectado = reg.acuerdo?.id_evento || null;
      etiquetaDato = `Aporte #${id_acuerdo}-${nro_cumplimiento} (${reg.acuerdo?.glosa || ''})`;
      await tx.cumplimientoAporte.update({
        where: { id_acuerdo_nro_cumplimiento: { id_acuerdo, nro_cumplimiento } },
        data: { monto_recibido: montoNum },
      });
    } else if (tabla === 'pago_remuneracion') {
      const reg = await tx.pagoRemuneracion.findUnique({
        where: { id_pago_rem: Number(id_registro) },
        include: { asignacion: { select: { id_evento: true } } },
      });
      if (!reg) throw Object.assign(new Error('Pago de remuneración no encontrado.'), { status: 404 });
      if (!enMes(reg.fecha)) throw Object.assign(new Error('El registro no pertenece al mes seleccionado.'), { status: 400 });
      valorAnterior = reg.monto;
      idEventoAfectado = reg.asignacion?.id_evento || null;
      etiquetaDato = `Pago remuneración #${reg.id_pago_rem}`;
      await tx.pagoRemuneracion.update({
        where: { id_pago_rem: reg.id_pago_rem },
        data: { monto: montoNum },
      });
    } else if (tabla === 'gasto_evento') {
      const reg = await tx.gastoEvento.findUnique({
        where: { id_gasto: Number(id_registro) },
        include: { asignacion: { select: { id_evento: true } } },
      });
      if (!reg) throw Object.assign(new Error('Gasto de evento no encontrado.'), { status: 404 });
      if (!enMes(reg.fecha)) throw Object.assign(new Error('El registro no pertenece al mes seleccionado.'), { status: 400 });
      valorAnterior = reg.monto;
      idEventoAfectado = reg.asignacion?.id_evento || null;
      etiquetaDato = `Gasto evento #${reg.id_gasto} (${reg.tipo_gasto})`;
      await tx.gastoEvento.update({
        where: { id_gasto: reg.id_gasto },
        data: { monto: montoNum },
      });
    } else if (tabla === 'gasto_fijo') {
      const reg = await tx.gastoFijo.findUnique({
        where: { id_gasto_fijo: Number(id_registro) },
      });
      if (!reg) throw Object.assign(new Error('Gasto fijo no encontrado.'), { status: 404 });
      if (reg.id_mes !== mesContable.id_mes) throw Object.assign(new Error('El registro no pertenece al mes seleccionado.'), { status: 400 });
      valorAnterior = reg.monto;
      idEventoAfectado = null;
      etiquetaDato = `Gasto fijo #${reg.id_gasto_fijo} (${reg.descripcion})`;
      await tx.gastoFijo.update({
        where: { id_gasto_fijo: reg.id_gasto_fijo },
        data: { monto: montoNum },
      });
    } else {
      throw Object.assign(new Error('Tipo de registro no válido para corrección.'), { status: 400 });
    }

    // 1. Registrar trazabilidad en historial_cambio
    await tx.historialCambio.create({
      data: {
        tabla_afectada: tabla,
        dato: etiquetaDato.slice(0, 60),
        valor_anterior: `$${Number(valorAnterior).toLocaleString('es-CL')}`,
        valor_nuevo: `$${montoNum.toLocaleString('es-CL')}`,
        motivo: motivo.trim().slice(0, 255),
        id_contador: contadorId,
        id_evento: idEventoAfectado,
      },
    });

    // 2. Recalcular evento afectado si corresponde
    await recalcularRentabilidadEvento(tx, idEventoAfectado);

    // 3. Recalcular todos los totales del mes cerrado en mes_contable
    const [pagosAgg, aportesAgg, remunAgg, gastosEvAgg, gastosFijosAgg, perdidasAgg] =
      await Promise.all([
        tx.pagoCliente.aggregate({
          where: { fecha: { gte: fechaInicio, lt: fechaFin } },
          _sum: { monto: true },
        }),
        tx.cumplimientoAporte.aggregate({
          where: { fecha: { gte: fechaInicio, lt: fechaFin } },
          _sum: { monto_recibido: true },
        }),
        tx.pagoRemuneracion.aggregate({
          where: { fecha: { gte: fechaInicio, lt: fechaFin } },
          _sum: { monto: true },
        }),
        tx.gastoEvento.aggregate({
          where: { fecha: { gte: fechaInicio, lt: fechaFin } },
          _sum: { monto: true },
        }),
        tx.gastoFijo.aggregate({
          where: { id_mes: mesContable.id_mes },
          _sum: { monto: true },
        }),
        tx.incidente.aggregate({
          where: { fecha: { gte: fechaInicio, lt: fechaFin } },
          _sum: { valor: true },
        }),
      ]);

    const totalIngresos = Number(pagosAgg._sum.monto || 0);
    const totalAportes = Number(aportesAgg._sum.monto_recibido || 0);
    const totalRemuneraciones = Number(remunAgg._sum.monto || 0);
    const totalGastosEvento = Number(gastosEvAgg._sum.monto || 0);
    const totalGastosFijos = Number(gastosFijosAgg._sum.monto || 0);
    const totalPerdidas = Number(perdidasAgg._sum.valor || 0);
    const utilidadNeta =
      totalIngresos +
      totalAportes -
      (totalRemuneraciones + totalGastosEvento + totalGastosFijos + totalPerdidas);

    const mesActualizado = await tx.mesContable.update({
      where: { id_mes: mesContable.id_mes },
      data: {
        total_ingresos: totalIngresos,
        total_aportes: totalAportes,
        total_remuneraciones: totalRemuneraciones,
        total_gastos_evento: totalGastosEvento,
        total_gastos_fijos: totalGastosFijos,
        total_perdidas: totalPerdidas,
        utilidad_neta: utilidadNeta,
      },
    });

    return {
      mensaje: 'Corrección aplicada, historial registrado y totales recalculados.',
      mes_contable: mesActualizado,
    };
  });
};