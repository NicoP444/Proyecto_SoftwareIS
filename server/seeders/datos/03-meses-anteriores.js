// ============================================================================
//  3. MESES ANTERIORES (historia del negocio)
//   - Hace 2 meses: eventos cerrados, todo pagado y el MES CONTABLE YA CERRADO
//     (sirve para ver un resumen fijo y para probar "Corregir mes cerrado").
//   - El mes pasado: todos los eventos realizados o cerrados, con remuneraciones
//     por pagar y una pérdida → el Contador PUEDE CERRAR este mes.
// ============================================================================
import { prisma, mes, crearEventos } from '../lib/base.js';
import { cerrarMesContableService } from '../../src/services/cierreMes.service.js';

const GASTOS_FIJOS = [
  { descripcion: 'Arriendo de bodega de equipos', monto: 350000 },
  { descripcion: 'Internet y plataforma de streaming', monto: 45000 },
];

async function gastosFijosDelMes({ anio, mes: m }, ctx, extra = []) {
  const mesContable = await prisma.mesContable.create({ data: { anio, mes: m } });
  for (const g of [...GASTOS_FIJOS, ...extra]) {
    await prisma.gastoFijo.create({ data: { ...g, id_mes: mesContable.id_mes, id_contador: ctx.contador.id_contador } });
  }
}

export default async function sembrarMesesAnteriores(ctx) {
  // ------------------------------- Hace 2 meses -------------------------------
  const m2 = mes(-2);
  await crearEventos(
    [
      {
        tipo: 'Final regional de fútbol', cliente: 'andes', fecha: m2.dia(6), ini: '15:00', fin: '17:30',
        dir: 'Estadio Municipal, Concepción', precio: 280000, estado: 'CERRADO',
        pagos: [['PAGO_TOTAL', 280000, m2.dia(3)]],
        personal: [['carlos', 'cam', 20, 'SIN_GASTOS', 'PAGADA'], ['sebastian', 'son', 15, 'SIN_GASTOS', 'PAGADA'], ['valentina', 'asis', 10, 'SIN_GASTOS', 'PAGADA']],
        salidas: [{ kit: 'k1', responsable: 'carlos', sale: '13:30', vuelve: '18:30' }],
      },
      {
        tipo: 'Matrimonio Fuentes-Lagos', cliente: 'sur', fecha: m2.dia(14), ini: '16:00', fin: '23:00',
        dir: 'Centro de Eventos, Hualpén', precio: 520000, estado: 'CERRADO',
        pagos: [['ADELANTO', 260000, m2.dia(2)], ['SALDO', 260000, m2.dia(15)]],
        personal: [['carlos', 'cam', 18, 'SIN_GASTOS', 'PAGADA'], ['sebastian', 'son', 12, 'SIN_GASTOS', 'PAGADA'], ['matias', 'swi', 10, 'RENDIDA', 'PAGADA']],
        gastos: [{ quien: 'matias', tipo_gasto: 'MOVILIZACION', monto: 15000, descripcion: 'Taxi de vuelta con equipos', origen: 'Hualpén', destino: 'Concepción' }],
        salidas: [{ kit: 'k2', responsable: 'matias', sale: '14:00', vuelve: '23:50' }],
      },
      {
        tipo: 'Licenciatura cuartos medios', cliente: 'sanmartin', fecha: m2.dia(22), ini: '11:00', fin: '14:00',
        dir: 'Gimnasio Colegio San Martín, Concepción', precio: 190000, estado: 'CERRADO',
        pagos: [['PAGO_TOTAL', 190000, m2.dia(19)]],
        personal: [['carlos', 'cam', 25, 'SIN_GASTOS', 'PAGADA'], ['valentina', 'asis', 10, 'SIN_GASTOS', 'PAGADA']],
        acuerdos: [{ ausp: 'espiga', glosa: 'Canje: colación para el equipo y mención en pantalla', tipo_aporte: 'CANJE', monto: 40000, canje: 'Colación para 4 personas', menciones: 2, fecha: m2.dia(22), estado: 'CUMPLIDO', recibido: [40000, m2.dia(22)] }],
      },
    ],
    ctx,
    `Hace 2 meses (${m2.mes}/${m2.anio}) · se cierra el mes contable`,
  );
  await gastosFijosDelMes(m2, ctx);
  const cierre = await cerrarMesContableService({ anio: m2.anio, mes: m2.mes, id_contador: ctx.contador.id_contador });
  console.log(`  → Mes ${m2.mes}/${m2.anio} CERRADO · utilidad neta $${cierre.mes_contable.utilidad_neta.toLocaleString('es-CL')}`);

  // ------------------------------- El mes pasado -------------------------------
  const m1 = mes(-1);
  await crearEventos(
    [
      {
        // Pérdida: el cliente solo pagó el adelanto y las remuneraciones son altas
        tipo: 'Copa universitaria de básquetbol', cliente: 'liga', fecha: m1.dia(4), ini: '17:00', fin: '20:00',
        dir: 'Gimnasio Universitario, Concepción', precio: 200000, estado: 'CERRADO',
        pagos: [['ADELANTO', 100000, m1.dia(1)]],
        personal: [['carlos', 'cam', 30], ['sebastian', 'son', 25], ['valentina', 'asis', 15]],
        acuerdos: [{ ausp: 'cripto', glosa: 'Logo en marcador digital', tipo_aporte: 'DINERO', monto: 150000, menciones: 3, fecha: m1.dia(2), estado: 'INCOBRABLE', motivo: 'Dejó de contestar y la empresa no existe en el SII.' }],
      },
      {
        tipo: 'Charla tech en streaming', cliente: 'muni', fecha: m1.dia(11), ini: '10:00', fin: '12:30',
        dir: 'Auditorio Central, Concepción', precio: 150000, estado: 'CERRADO',
        pagos: [['PAGO_TOTAL', 150000, m1.dia(9)]],
        personal: [['sebastian', 'cam', 20, 'SIN_GASTOS', 'PAGADA'], ['valentina', 'son', 15, 'SIN_GASTOS', 'PAGADA']],
        salidas: [{ kit: 'k3', responsable: 'sebastian', sale: '08:30', vuelve: '13:15' }],
      },
      {
        tipo: 'Matrimonio Soto-Pérez', cliente: 'sur', fecha: m1.dia(18), ini: '15:00', fin: '22:00',
        dir: 'Viña Santa Cruz, Chiguayante', precio: 480000, estado: 'CERRADO',
        pagos: [['ADELANTO', 240000, m1.dia(2)], ['SALDO', 240000, m1.dia(19)]],
        personal: [['carlos', 'cam', 18, 'RENDIDA', 'PAGADA'], ['sebastian', 'son', 12, 'SIN_GASTOS', 'PAGADA'], ['matias', 'swi', 10, 'SIN_GASTOS']],
        gastos: [
          { quien: 'carlos', tipo_gasto: 'PEAJE', monto: 3500, descripcion: 'Peaje ruta a Chiguayante' },
          { quien: 'carlos', tipo_gasto: 'ALIMENTACION', monto: 9000, descripcion: 'Colación del equipo' },
        ],
        acuerdos: [{ ausp: 'cocacola', glosa: 'Mención en la transmisión y logo en pantalla', tipo_aporte: 'DINERO', monto: 100000, menciones: 5, fecha: m1.dia(18), estado: 'CUMPLIDO', recibido: [100000, m1.dia(20)] }],
        salidas: [{ kit: 'k2', responsable: 'carlos', sale: '13:00', vuelve: '22:45' }],
      },
      {
        // Realizado pero sin cerrar la jornada: igual permite cerrar el mes
        tipo: 'Torneo de vóleibol', cliente: 'andes', fecha: m1.dia(25), ini: '10:00', fin: '14:00',
        dir: 'Polideportivo Los Andes, Concepción', precio: 220000, estado: 'REALIZADO',
        pagos: [['PAGO_TOTAL', 220000, m1.dia(22)]],
        personal: [['carlos', 'cam', 20], ['valentina', 'asis', 10]],
      },
    ],
    ctx,
    `El mes pasado (${m1.mes}/${m1.anio}) · listo para que el Contador lo cierre`,
  );
  await gastosFijosDelMes(m1, ctx, [{ descripcion: 'Mantención de cámaras', monto: 80000 }]);
}
