// ============================================================================
//  4. AGENDA DE LAS PRÓXIMAS SEMANAS (el día a día de la empresa)
//  Eventos normales con personal y kits ya asignados, pagos parciales,
//  pendientes de adelanto y acuerdos de auspicio por cobrar.
//  Los días no chocan con los de los casos de prueba (05-casos.js).
// ============================================================================
import { prisma, dia, mes, crearEventos } from '../lib/base.js';

export default async function sembrarAgenda(ctx) {
  await crearEventos(
    [
      {
        tipo: 'Partido de fútbol', cliente: 'andes', fecha: dia(2), ini: '16:00', fin: '18:30',
        dir: 'Estadio Municipal, Concepción', precio: 220000, estado: 'CONFIRMADO',
        pagos: [['ADELANTO', 110000, dia(-6)]],
        personal: [['carlos', 'cam'], ['sebastian', 'son']], kits: ['k1'],
      },
      {
        tipo: 'Acto de graduación', cliente: 'sanmartin', fecha: dia(3), ini: '10:00', fin: '13:00',
        dir: 'Gimnasio Colegio San Martín, Concepción', precio: 180000, estado: 'CONFIRMADO',
        personal: [['carlos', 'cam'], ['valentina', 'asis']], kits: ['k3'],
      },
      {
        tipo: 'Concierto al aire libre', cliente: 'muni', fecha: dia(6), ini: '19:00', fin: '22:30',
        dir: 'Plaza Independencia, Concepción', precio: 600000, estado: 'CONFIRMADO',
        pagos: [['ADELANTO', 300000, dia(-10)]],
        personal: [['carlos', 'cam'], ['sebastian', 'son'], ['valentina', 'asis']], kits: ['k1', 'k2'],
        acuerdos: [{ ausp: 'entel', glosa: 'Logo en pantalla y 4 menciones durante el concierto', tipo_aporte: 'DINERO', monto: 250000, menciones: 4, fecha: dia(4), estado: 'PENDIENTE' }],
      },
      {
        tipo: 'Final de campeonato', cliente: 'liga', fecha: dia(10), ini: '14:00', fin: '20:00',
        dir: 'Complejo Deportivo Sur, Coronel', precio: 700000, estado: 'PENDIENTE_ADELANTO',
        personal: [['carlos', 'cam'], ['sebastian', 'son']],
      },
      {
        tipo: 'Matrimonio Rojas-Muñoz', cliente: 'sur', fecha: dia(16), ini: '16:00', fin: '23:00',
        dir: 'Centro de Eventos, Hualpén', precio: 480000, estado: 'PENDIENTE_ADELANTO',
        pagos: [['ADELANTO', 100000, dia(-2)]],
      },
      {
        tipo: 'Campeonato de fútbol amateur', cliente: 'andes', fecha: dia(19), ini: '09:00', fin: '15:00',
        dir: 'Estadio Municipal, Concepción', precio: 350000, estado: 'CONFIRMADO',
        pagos: [['ADELANTO', 175000, dia(-1)]],
      },
      {
        tipo: 'Cena de gala municipal', cliente: 'muni', fecha: dia(23), ini: '19:30', fin: '23:00',
        dir: 'Salón de Honor Municipalidad, Concepción', precio: 280000, estado: 'CONFIRMADO',
        pagos: [['PAGO_TOTAL', 280000, dia(-3)]],
        personal: [['matias', 'swi'], ['valentina', 'asis']],
        acuerdos: [{ ausp: 'redbull', glosa: 'Canje: bebidas para invitados y mención', tipo_aporte: 'CANJE', monto: 60000, canje: '3 cajas de bebidas', menciones: 2, fecha: dia(21), estado: 'PENDIENTE' }],
      },
      {
        tipo: 'Fiesta de fin de temporada', cliente: 'sur', fecha: dia(27), ini: '20:00', fin: '23:30',
        dir: 'Centro de Eventos, Hualpén', precio: 320000, estado: 'CONFIRMADO',
        pagos: [['ADELANTO', 160000, dia(-4)]],
      },
      {
        tipo: 'Partido de exhibición', cliente: 'liga', fecha: dia(30), ini: '17:00', fin: '19:30',
        dir: 'Estadio Ester Roa, Concepción', precio: 240000, estado: 'CONFIRMADO',
      },
      {
        tipo: 'Aniversario del colegio', cliente: 'sanmartin', fecha: dia(35), ini: '11:00', fin: '14:00',
        dir: 'Teatro Biobío, Concepción', precio: 200000, estado: 'CONFIRMADO',
      },
    ],
    ctx,
    'Agenda de las próximas semanas',
  );

  // Gastos fijos del mes actual (mes abierto)
  const m0 = mes(0);
  const mesContable = await prisma.mesContable.create({ data: { anio: m0.anio, mes: m0.mes } });
  for (const g of [
    { descripcion: 'Arriendo de bodega de equipos', monto: 350000 },
    { descripcion: 'Internet y plataforma de streaming', monto: 45000 },
  ]) {
    await prisma.gastoFijo.create({ data: { ...g, id_mes: mesContable.id_mes, id_contador: ctx.contador.id_contador } });
  }
}
