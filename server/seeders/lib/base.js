// ============================================================================
//  Herramientas comunes de los seeders: fechas relativas, RUT, remuneraciones
//  y la función que crea un evento completo (pagos, personal, gastos, kits,
//  salidas, incidentes, auspicios y rentabilidad si está cerrado).
// ============================================================================
import fs from 'fs';
import prisma from '../../src/config/prisma.js';

export { prisma };

// ---------------------------------------------------------------------------
//  Fechas: todo es RELATIVO A HOY (hora local), así el set nunca queda viejo
// ---------------------------------------------------------------------------
const pad = (n) => String(n).padStart(2, '0');
const isoLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const HOY = new Date();
HOY.setHours(0, 0, 0, 0);

/** Día relativo a hoy como "AAAA-MM-DD": dia(0) = hoy, dia(-1) = ayer, dia(5) = en 5 días */
export const dia = (n) => isoLocal(new Date(HOY.getFullYear(), HOY.getMonth(), HOY.getDate() + n));

/** Mes relativo al actual: mes(-1) = mes pasado. Devuelve { anio, mes, dia(n) } */
export const mes = (k) => {
  const d = new Date(HOY.getFullYear(), HOY.getMonth() + k, 1);
  return { anio: d.getFullYear(), mes: d.getMonth() + 1, dia: (n) => isoLocal(new Date(d.getFullYear(), d.getMonth(), n)) };
};

/** Suma días a una fecha "AAAA-MM-DD" */
export const masDias = (iso, n) => {
  const [a, m, d] = iso.split('-').map(Number);
  return isoLocal(new Date(a, m - 1, d + n));
};

export const fechaDB = (iso) => new Date(`${iso}T00:00:00Z`); // columnas @db.Date (como el resto del sistema)
export const horaDB = (hhmm) => new Date(`1970-01-01T${hhmm}:00Z`); // columnas @db.Time
export const momento = (iso, hhmm) => new Date(`${iso}T${hhmm}:00`); // columnas Timestamp (hora local)
export const legible = (iso) => iso.split('-').reverse().join('/');

// ---------------------------------------------------------------------------
//  Reglas del sistema replicadas
// ---------------------------------------------------------------------------

/** RF-P7-07: porcentaje × precio, redondeado al peso (igual que remuneracion.service.js) */
export const remuneracion = (pct, precio) => Math.floor((Math.round(pct * 100) * precio + 5000) / 10000);

/** RUT válido: agrega el dígito verificador (módulo 11) al cuerpo */
export function rut(cuerpo) {
  let suma = 0;
  let mul = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const r = 11 - (suma % 11);
  return cuerpo + (r === 11 ? '0' : r === 10 ? 'K' : String(r));
}

/** Archivo de evidencia de ejemplo (PNG de 1×1) para los gastos sembrados */
export function evidencia(nombre) {
  const carpeta = new URL('../../uploads/evidencias/', import.meta.url);
  fs.mkdirSync(carpeta, { recursive: true });
  const archivo = new URL(nombre, carpeta);
  if (!fs.existsSync(archivo)) {
    fs.writeFileSync(
      archivo,
      Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
    );
  }
  return `uploads/evidencias/${nombre}`;
}

// ---------------------------------------------------------------------------
//  Crear un evento completo
// ---------------------------------------------------------------------------
//  spec = {
//    tipo, cliente, fecha, ini, fin, dir, precio, estado, nota?,
//    pagos?:    [[tipo_pago, monto, fecha]],
//    personal?: [[trabajador, rol, porcentaje|null, estado_rendicion?, estado_pago?, fecha_pago?]],
//    gastos?:   [{ quien, tipo_gasto, monto, descripcion, origen?, destino? }],
//    kits?:     ['k1'] (reservados, sin salida),
//    salidas?:  [{ kit, responsable, sale, vuelve?, perdido?: codigo }],
//    acuerdos?: [{ ausp, glosa, tipo_aporte, monto, canje?, menciones?, fecha, estado, recibido?: [monto, fecha], motivo? }],
//  }
//  ctx = lo que crearon los pasos anteriores (usuarios, roles, trabajadores, clientes, kits, equipos, auspiciadores)
export async function crearEvento(spec, ctx) {
  const realizado = ['REALIZADO', 'CERRADO'].includes(spec.estado);
  // Día de cierre de la jornada: el último día en que entró plata (pagos del cliente o aportes).
  // Con la jornada cerrada el sistema ya no acepta pagos, así que nada puede quedar después del cierre.
  const ingresos = [...(spec.pagos ?? []).map(([, , f]) => f), ...(spec.acuerdos ?? []).filter((a) => a.recibido).map((a) => a.recibido[1])];
  const diaCierre = [spec.fecha, ...ingresos].sort().at(-1);
  const personal = (spec.personal ?? []).map(([quien, r, pct = null, rendicion, pago = 'POR_PAGAR', fechaPago]) => ({
    quien, r, pct, pago,
    rendicion: rendicion ?? (realizado ? 'SIN_GASTOS' : null),
    // Las remuneraciones se pagan después del cierre (el sistema no deja pagar antes)
    fechaPago: fechaPago ?? [masDias(spec.fecha, 3), masDias(diaCierre, 1)].sort().at(-1),
    monto: pct === null ? null : remuneracion(pct, spec.precio),
  }));
  const evidencias = [evidencia('seed-boleta-1.png'), evidencia('seed-boleta-2.png')];

  return prisma.$transaction(async (tx) => {
    const evento = await tx.evento.create({
      data: {
        tipo: spec.tipo,
        fecha: fechaDB(spec.fecha),
        hora_inicio: horaDB(spec.ini),
        hora_termino: horaDB(spec.fin),
        direccion: spec.dir,
        precio_acordado: spec.precio,
        observaciones: spec.nota ? spec.nota.slice(0, 255) : null,
        estado: spec.estado,
        id_cliente: ctx.cli[spec.cliente].id_cliente,
        id_dueno: ctx.dueno.id_dueno,
      },
    });

    for (const [tipo_pago, monto, fecha] of spec.pagos ?? []) {
      await tx.pagoCliente.create({
        data: { tipo_pago, monto, fecha: fechaDB(fecha), medio_pago: 'Transferencia', id_evento: evento.id_evento, id_contador: ctx.contador.id_contador },
      });
    }

    const asig = {};
    for (const p of personal) {
      asig[p.quien] = await tx.asignacionPersonal.create({
        data: {
          id_evento: evento.id_evento,
          id_trabajador: ctx.trab[p.quien].id_trabajador,
          id_rol: ctx.rol[p.r].id_rol,
          id_dueno: ctx.dueno.id_dueno,
          porcentaje: p.pct,
          remuneracion: p.monto,
          estado_rendicion: p.rendicion,
          estado_pago: p.pago,
        },
      });
      if (p.pago === 'PAGADA') {
        await tx.pagoRemuneracion.create({
          data: { fecha: fechaDB(p.fechaPago), monto: p.monto, medio_pago: 'Transferencia', id_asignacion: asig[p.quien].id_asignacion, id_contador: ctx.contador.id_contador },
        });
      }
    }

    let totalGastos = 0;
    for (const [i, g] of (spec.gastos ?? []).entries()) {
      totalGastos += g.monto;
      await tx.gastoEvento.create({
        data: {
          tipo_gasto: g.tipo_gasto, monto: g.monto, fecha: fechaDB(spec.fecha), descripcion: g.descripcion,
          origen: g.origen ?? null, destino: g.destino ?? null, evidencia: evidencias[i % evidencias.length],
          id_asignacion: asig[g.quien].id_asignacion, id_contador: ctx.contador.id_contador,
        },
      });
    }

    for (const k of spec.kits ?? []) {
      await tx.reservaKit.create({ data: { id_evento: evento.id_evento, id_kit: ctx.kit[k].id_kit, id_dueno: ctx.dueno.id_dueno } });
    }

    let perdidas = 0;
    for (const s of spec.salidas ?? []) {
      const reserva = await tx.reservaKit.create({ data: { id_evento: evento.id_evento, id_kit: ctx.kit[s.kit].id_kit, id_dueno: ctx.dueno.id_dueno } });
      const salida = await tx.salidaKit.create({
        data: {
          id_reserva: reserva.id_reserva,
          id_asignacion: asig[s.responsable].id_asignacion,
          id_jefe: ctx.jefe.id_jefe,
          fecha_hora_salida: momento(spec.fecha, s.sale),
          fecha_hora_retorno: s.vuelve ? momento(spec.fecha, s.vuelve) : null,
        },
      });
      if (!s.vuelve) continue;
      for (const eq of ctx.equipos.filter((x) => x.kit === s.kit)) {
        const perdido = eq.codigo === s.perdido;
        await tx.revisa.create({
          data: {
            id_salida: salida.id_salida, codigo: eq.codigo,
            estado_retorno: perdido ? 'PERDIDO' : 'OPERATIVO',
            observacion: perdido ? 'No volvió del evento: se presume extraviado en el desmontaje' : null,
          },
        });
        if (perdido) {
          perdidas += eq.valor_compra;
          await tx.incidente.create({
            data: {
              tipo: 'PERDIDA', fecha: fechaDB(spec.fecha), valor: eq.valor_compra, codigo: eq.codigo,
              descripcion: `${eq.nombre} extraviado durante el desmontaje`,
              id_evento: evento.id_evento, id_trabajador: ctx.trab[s.responsable].id_trabajador, id_jefe: ctx.jefe.id_jefe,
            },
          });
        }
      }
    }

    let aportes = 0;
    for (const a of spec.acuerdos ?? []) {
      const acuerdo = await tx.acuerdoAuspicio.create({
        data: {
          glosa: a.glosa, tipo_aporte: a.tipo_aporte, monto_comprometido: a.monto,
          descripcion_canje: a.canje ?? null, cant_menciones: a.menciones ?? null,
          fecha_comprometida: fechaDB(a.fecha), estado: a.estado, motivo_incobrable: a.motivo ?? null,
          id_auspiciador: ctx.ausp[a.ausp].id_auspiciador, id_evento: evento.id_evento, id_dueno: ctx.dueno.id_dueno,
        },
      });
      if (a.recibido) {
        aportes += a.recibido[0];
        await tx.cumplimientoAporte.create({
          data: { id_acuerdo: acuerdo.id_acuerdo, nro_cumplimiento: 1, fecha: fechaDB(a.recibido[1]), monto_recibido: a.recibido[0], id_contador: ctx.contador.id_contador },
        });
      }
    }

    // Jornada cerrada: rentabilidad fija, con la misma fórmula de rentabilidad.service.js (RF-P7-09)
    if (spec.estado === 'CERRADO') {
      const pagado = (spec.pagos ?? []).reduce((s, [, m]) => s + m, 0);
      const rem = personal.reduce((s, p) => s + (p.monto ?? 0), 0);
      await tx.evento.update({
        where: { id_evento: evento.id_evento },
        data: {
          rentabilidad_final: pagado + aportes - rem - totalGastos - perdidas,
          fecha_cierre: momento(diaCierre, diaCierre === spec.fecha ? '23:59' : '18:00'),
        },
      });
    }
    return evento;
  });
}

/** Crea una lista de eventos e imprime una línea por cada uno */
export async function crearEventos(lista, ctx, titulo) {
  console.log(`\n${titulo}`);
  for (const spec of lista) {
    await crearEvento(spec, ctx);
    console.log(`  ${legible(spec.fecha)}  ${spec.tipo.padEnd(36)} ${spec.estado}`);
  }
}
