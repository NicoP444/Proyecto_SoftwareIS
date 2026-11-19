// ============================================================================
//  5. CASOS DE PRUEBA (entrega final)
//  Un escenario listo en cada etapa del ciclo de un evento. Cada uno se llama
//  "Cxx · ..." y su observación dice QUÉ PROBAR. La planilla "Plan de pruebas"
//  tiene el paso a paso y el resultado esperado de cada caso.
// ============================================================================
import { dia, crearEventos } from '../lib/base.js';

const nota = (texto) => `Caso de prueba: ${texto}`;

export default async function sembrarCasos(ctx) {
  await crearEventos(
    [
      // ===================== AGENDA (Dueño) =====================
      {
        tipo: 'C01 · Partido amistoso', cliente: 'rugby', fecha: dia(5), ini: '10:00', fin: '12:00',
        dir: 'Estadio Municipal, Concepción', precio: 180000, estado: 'CONFIRMADO',
        nota: nota('evento vacío. Asignar a Ana (sin avisos) y a Daniela (avisa disponibilidad), el Kit Estudio Móvil 04 (ok) y el Kit Compacto 06 (debe fallar: incompleto). Probar auspicio, convocatoria, modificar y eliminar.'),
      },
      {
        tipo: 'C02 · Matrimonio', cliente: 'andeslive', fecha: dia(7), ini: '14:00', fin: '21:00',
        dir: 'Viña Santa Cruz, Chiguayante', precio: 600000, estado: 'PENDIENTE_ADELANTO',
        acuerdos: [{ ausp: 'rapidas', glosa: 'Logo en la transmisión del matrimonio', tipo_aporte: 'DINERO', monto: 200000, menciones: 2, fecha: dia(-5), estado: 'VENCIDO' }],
        nota: nota('dura 7 h y no tiene pagos. Contador: ADELANTO de $300.000 → pasa a Confirmado. Dueño: declarar incobrable el acuerdo VENCIDO de Inversiones Rápidas.'),
      },
      {
        tipo: 'C03 · Feria costumbrista', cliente: 'cultura', fecha: dia(9), ini: '09:00', fin: '15:00',
        dir: 'Plaza de Armas, Penco', precio: 500000, estado: 'PENDIENTE_ADELANTO',
        pagos: [['ADELANTO', 100000, dia(-1)]],
        nota: nota('adelanto de $100.000 (no alcanza el 50%). Contador: un SALDO menor a lo que falta debe rechazarse; otro ADELANTO de $150.000 llega al 50% y pasa a Confirmado.'),
      },

      // ---- C04: un día con 4 eventos ("+2 más" en la vista Mes) ----
      { tipo: 'C04 · Charla de orientación', cliente: 'robles', fecha: dia(12), ini: '08:00', fin: '10:00', dir: 'Colegio Los Robles, San Pedro de la Paz', precio: 120000, estado: 'CONFIRMADO',
        nota: nota('día con 4 eventos: en la vista Mes se ven 2 y el botón "+2 más". Probar también la vista Semana.') },
      { tipo: 'C04 · Seminario de cultura', cliente: 'cultura', fecha: dia(12), ini: '11:00', fin: '13:00', dir: 'Teatro Municipal, Penco', precio: 160000, estado: 'CONFIRMADO',
        nota: nota('día con 4 eventos (ver C04 · Charla de orientación).') },
      { tipo: 'C04 · Torneo escolar', cliente: 'robles', fecha: dia(12), ini: '15:00', fin: '17:00', dir: 'Gimnasio Colegio Los Robles, San Pedro de la Paz', precio: 140000, estado: 'CONFIRMADO',
        nota: nota('día con 4 eventos (ver C04 · Charla de orientación).') },
      { tipo: 'C04 · Concierto de bandas', cliente: 'andeslive', fecha: dia(12), ini: '19:00', fin: '22:00', dir: 'Teatro Biobío, Concepción', precio: 450000, estado: 'CONFIRMADO',
        acuerdos: [{ ausp: 'cafe', glosa: 'Mención en pantalla y logo durante el concierto', tipo_aporte: 'DINERO', monto: 150000, menciones: 4, fecha: dia(10), estado: 'PENDIENTE' }],
        nota: nota('acuerdo PENDIENTE con Café Puerto Sur ($150.000). Contador: registrar el aporte recibido → queda Cumplido.') },

      // ---- C05: margen de traslado y traslapes (mismo día) ----
      {
        tipo: 'C05 · Final de básquetbol', cliente: 'rugby', fecha: dia(14), ini: '10:00', fin: '12:00',
        dir: 'Gimnasio Municipal, Concepción', precio: 300000, estado: 'CONFIRMADO',
        personal: [['bruno', 'son']], kits: ['k4'],
        nota: nota('Bruno y el Kit Estudio Móvil 04 ya están aquí. Personal disponible 10:00-12:00: Bruno Ocupado; Ana, Carlos, Sebastián y Valentina Disponibles; Daniela, Gonzalo y Matías Sin disponibilidad; Esteban En licencia; Fernanda Inactivo.'),
      },
      {
        tipo: 'C05 · Charla en Talcahuano', cliente: 'cultura', fecha: dia(14), ini: '12:30', fin: '14:00',
        dir: 'Centro Cultural, Talcahuano', precio: 150000, estado: 'CONFIRMADO',
        nota: nota('asignar a Bruno o el Kit Estudio Móvil 04: se permite, pero AVISA margen de traslado (30 min < 60). Con el margen en 20 min el aviso desaparece.'),
      },
      {
        tipo: 'C05 · Clínica deportiva', cliente: 'robles', fecha: dia(14), ini: '11:00', fin: '13:00',
        dir: 'Estadio Collao, Concepción', precio: 130000, estado: 'CONFIRMADO',
        nota: nota('se traslapa con la Final de básquetbol: asignar a Bruno o el Kit Estudio Móvil 04 debe dar ERROR (no solo aviso).'),
      },

      // ===================== DÍA DEL EVENTO (Jefe técnico) =====================
      {
        tipo: 'C08 · Transmisión de hoy', cliente: 'andeslive', fecha: dia(0), ini: '15:00', fin: '23:00',
        dir: 'Arena Sur, Talcahuano', precio: 420000, estado: 'CONFIRMADO',
        pagos: [['PAGO_TOTAL', 420000, dia(-2)]], personal: [['ana', 'cam'], ['bruno', 'son']], kits: ['k4'],
        nota: nota('es HOY. Jefe técnico: registrar la SALIDA del Kit Estudio Móvil 04 con Ana como responsable → queda En terreno.'),
      },

      // ===================== DESPUÉS DEL EVENTO =====================
      {
        tipo: 'C09 · Partido de ayer', cliente: 'rugby', fecha: dia(-1), ini: '10:00', fin: '12:00',
        dir: 'Cancha Lomas, Concepción', precio: 200000, estado: 'CONFIRMADO',
        pagos: [['PAGO_TOTAL', 200000, dia(-5)]], personal: [['ana', 'cam'], ['daniela', 'asis']],
        nota: nota('ya terminó y sigue Confirmado (alerta en el panel del Dueño). Dueño: MARCAR COMO REALIZADO → las rendiciones de Ana y Daniela quedan Pendientes.'),
      },
      {
        tipo: 'C10 · Kit sin retorno', cliente: 'cultura', fecha: dia(-2), ini: '09:00', fin: '13:00',
        dir: 'Parque Costanera, Penco', precio: 350000, estado: 'REALIZADO',
        pagos: [['PAGO_TOTAL', 350000, dia(-9)]],
        personal: [['bruno', 'son', 15, 'PENDIENTE'], ['ana', 'cam', 20, 'SIN_GASTOS']],
        salidas: [{ kit: 'k5', responsable: 'bruno', sale: '08:00' }],
        nota: nota('el Kit Terreno 05 salió hace 2 días y no vuelve (alerta del Jefe). Jefe: RETORNO con MIC-005 Dañado ($60.000) → incidente y kit Incompleto. El cierre avisa kit y rendición pendientes.'),
      },

      // ===================== CIERRE (Contador y Dueño) =====================
      {
        tipo: 'C11 · Congreso regional', cliente: 'andeslive', fecha: dia(-3), ini: '09:00', fin: '18:00',
        dir: 'Hotel Sonesta, Concepción', precio: 400000, estado: 'REALIZADO',
        pagos: [['ADELANTO', 200000, dia(-10)]],
        personal: [['ana', 'cam', null, 'PENDIENTE'], ['bruno', 'son', null, 'PENDIENTE'], ['daniela', 'asis', null, 'PENDIENTE']],
        nota: nota('falta todo el cierre. Contador: SALDO $200.000, gasto de Daniela con boleta y rendiciones. Dueño: % (Ana 20, Bruno 15, Daniela 10). Sin % el cierre se bloquea.'),
      },
      {
        tipo: 'C12 · Gala lista para cerrar', cliente: 'robles', fecha: dia(-4), ini: '19:00', fin: '23:00',
        dir: 'Salón Los Robles, San Pedro de la Paz', precio: 500000, estado: 'REALIZADO',
        pagos: [['PAGO_TOTAL', 500000, dia(-12)]],
        personal: [['ana', 'cam', 20, 'RENDIDA'], ['bruno', 'son', 15, 'SIN_GASTOS']],
        gastos: [
          { quien: 'ana', tipo_gasto: 'MOVILIZACION', monto: 12000, descripcion: 'Uber ida y vuelta al salón', origen: 'Concepción', destino: 'San Pedro de la Paz' },
          { quien: 'ana', tipo_gasto: 'ALIMENTACION', monto: 8500, descripcion: 'Colación durante el montaje' },
        ],
        salidas: [{ kit: 'k4', responsable: 'ana', sale: '17:30', vuelve: '23:45' }],
        acuerdos: [{ ausp: 'radio', glosa: 'Canje: difusión radial de la gala', tipo_aporte: 'CANJE', monto: 80000, canje: '10 frases radiales de 30 segundos', menciones: 3, fecha: dia(-6), estado: 'CUMPLIDO', recibido: [80000, dia(-5)] }],
        nota: nota('todo listo. Dueño: CERRAR JORNADA → $384.500 (500.000 + 80.000 aporte − 175.000 remuneraciones − 20.500 gastos). Luego el Contador paga las remuneraciones.'),
      },
      {
        tipo: 'C13 · Cerrado por pagar', cliente: 'rugby', fecha: dia(-6), ini: '16:00', fin: '18:00',
        dir: 'Estadio Municipal, Concepción', precio: 300000, estado: 'CERRADO',
        pagos: [['PAGO_TOTAL', 300000, dia(-7)]],
        personal: [['ana', 'cam', 25, 'SIN_GASTOS', 'POR_PAGAR'], ['daniela', 'asis', 10, 'SIN_GASTOS', 'PAGADA', dia(-3)]],
        nota: nota('cerrado con $195.000. Daniela ya está pagada; Contador: pagar a Ana ($75.000). Ya no debe permitir cambiar porcentajes, kits ni personal.'),
      },
      {
        tipo: 'C14 · Cerrado con pérdida', cliente: 'cultura', fecha: dia(-8), ini: '18:00', fin: '21:00',
        dir: 'Muelle Histórico, Penco', precio: 250000, estado: 'CERRADO',
        pagos: [['ADELANTO', 125000, dia(-15)]],
        personal: [['bruno', 'son', 20], ['ana', 'cam', 20]],
        salidas: [{ kit: 'k6', responsable: 'bruno', sale: '16:30', vuelve: '22:30', perdido: 'CAM-006' }],
        nota: nota('se perdió la cámara CAM-006 ($1.200.000): resultado −$1.175.000. Revisar pérdidas en Finanzas e Inventario. El Kit Compacto 06 quedó Incompleto.'),
      },
    ],
    ctx,
    'Casos de prueba (Cxx)',
  );
}
