// ============================================================================
//  CASOS DE PRUEBA para la entrega final (SixSeven)
// ----------------------------------------------------------------------------
//  Deja el sistema con escenarios listos en cada etapa del ciclo de un evento:
//  agendar → cobrar adelanto → asignar personal y kits → salida → realizado →
//  retorno → gastos y rendiciones → porcentajes → cierre de jornada → pago de
//  remuneraciones, más auspiciadores, inventario, gastos fijos y login.
//
//  Cada evento se llama "Cxx · ..." y su observación dice QUÉ PROBAR en él.
//  Las fechas son RELATIVAS A HOY: los casos sirven sin importar el día en que se corra.
//
//  Uso (desde la carpeta server):
//    npm run seed:casos        → crea (o reinicia) todos los casos
//  Correrlo de nuevo deja los casos como nuevos (borra los suyos y los vuelve a crear).
//  No toca los datos de los otros seeders ni los que se crean a mano.
//  Requisitos: seed:base y seed:usuarios (dueño, contador y jefe técnico).
// ============================================================================
import 'dotenv/config';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma.js';

const MARCA = '[SEED-CASO]'; // empieza con "[SEED", así seed:limpiar también los borra

// ---------------------------------------------------------------------------
//  Fechas relativas a hoy (en hora local, como las usa la app)
// ---------------------------------------------------------------------------
const pad = (n) => String(n).padStart(2, '0');
const isoLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const HOY = new Date();
HOY.setHours(0, 0, 0, 0);
const diaRel = (n) => isoLocal(new Date(HOY.getFullYear(), HOY.getMonth(), HOY.getDate() + n)); // "AAAA-MM-DD"
const fechaDB = (iso) => new Date(`${iso}T00:00:00Z`); // columnas @db.Date (igual que el resto del sistema)
const horaDB = (hhmm) => new Date(`1970-01-01T${hhmm}:00Z`); // columnas @db.Time
const momento = (iso, hhmm) => new Date(`${iso}T${hhmm}:00`); // columnas Timestamp (hora local)
const diaLegible = (iso) => iso.split('-').reverse().join('/');

// RF-P7-07: porcentaje × precio, redondeado al peso (misma fórmula que remuneracion.service.js)
const remuneracion = (pct, precio) => Math.floor((Math.round(pct * 100) * precio + 5000) / 10000);

// Dígito verificador del RUT (módulo 11) para que todos los RUT sean válidos
function rutCon(cuerpo) {
  let suma = 0;
  let mul = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const r = 11 - (suma % 11);
  return cuerpo + (r === 11 ? '0' : r === 10 ? 'K' : String(r));
}

// ---------------------------------------------------------------------------
//  Datos de apoyo (todos con nombres propios, para no mezclarse con otros seeders)
// ---------------------------------------------------------------------------
const CLIENTES = {
  rugby: { rut: rutCon('76543210'), nombre: 'Club de Rugby Lomas', contacto: 'Felipe Urrutia', telefono: '+56961112233', correo: 'contacto@rugbylomas.cl' },
  cultura: { rut: rutCon('65432109'), nombre: 'Corporación Cultural Penco', contacto: 'María José Lagos', telefono: '+56962223344', correo: 'cultura@penco.cl' },
  andes: { rut: rutCon('77889900'), nombre: 'Productora Andes Live', contacto: 'Tomás Vera', telefono: '+56963334455', correo: 'eventos@andeslive.cl' },
  robles: { rut: rutCon('81234567'), nombre: 'Colegio Los Robles', contacto: 'Patricia Soto', telefono: '+56964445566' },
  // Sin eventos: para probar que SÍ se puede eliminar
  junta: { rut: rutCon('65111222'), nombre: 'Junta de Vecinos Pedro de Valdivia', contacto: 'Luis Cárcamo', telefono: '+56965556677' },
};

const ROLES = { cam: 'Camarógrafo Principal', son: 'Operador de Sonido', asis: 'Asistente de Transmisión' };
const PCT_REFERENCIAL = { cam: 20, son: 15, asis: 10 }; // solo si el rol se crea aquí

// disp: [desde, hasta] en días relativos a hoy · estado: ACTIVO (por defecto), LICENCIA o INACTIVO
const TRABAJADORES = {
  ana: { nombre: 'Ana Fuentes', telefono_whatsapp: '+56971110001', correo: 'ana.fuentes@sixseven.cl', roles: ['cam', 'son'], disp: [-60, 90] },
  bruno: { nombre: 'Bruno Díaz', telefono_whatsapp: '+56971110002', correo: 'bruno.diaz@sixseven.cl', roles: ['son', 'cam'], disp: [-60, 90] },
  daniela: { nombre: 'Daniela Rojas', telefono_whatsapp: '+56971110003', roles: ['asis'], disp: null }, // nunca registró disponibilidad
  gonzalo: { nombre: 'Gonzalo Paz', telefono_whatsapp: '+56971110004', roles: ['cam'], disp: [20, 45] }, // disponible solo más adelante
  esteban: { nombre: 'Esteban Mora', telefono_whatsapp: '+56971110005', roles: ['son'], disp: [-60, 90], estado: 'LICENCIA' },
  fernanda: { nombre: 'Fernanda Ruiz', telefono_whatsapp: '+56971110006', roles: ['asis'], disp: [-60, 90], estado: 'INACTIVO' },
};

const KITS = {
  k1: { nombre: 'Kit Casos 01 - Estudio Móvil', nivel: 'ESTANDAR', recargo_pct: 10, estado: 'DISPONIBLE' },
  k2: { nombre: 'Kit Casos 02 - Terreno', nivel: 'BASICO', recargo_pct: 0, estado: 'EN_TERRENO' },
  k3: { nombre: 'Kit Casos 03 - Incompleto', nivel: 'ALTA_GAMA', recargo_pct: 25, estado: 'INCOMPLETO' },
};

// kit: clave de KITS o null (repuesto suelto en bodega)
const EQUIPOS = [
  { codigo: 'CS-CAM-01', nombre: 'Cámara Panasonic HC-X2', categoria: 'CAMARA', marca: 'Panasonic', modelo: 'HC-X2', valor_compra: 1900000, kit: 'k1' },
  { codigo: 'CS-TRI-01', nombre: 'Trípode Sachtler Ace', categoria: 'TRIPODE', marca: 'Sachtler', modelo: 'Ace M', valor_compra: 420000, kit: 'k1' },
  { codigo: 'CS-MIC-01', nombre: 'Micrófono Sennheiser MKE 600', categoria: 'MICROFONO', marca: 'Sennheiser', modelo: 'MKE 600', valor_compra: 290000, kit: 'k1' },
  { codigo: 'CS-SWI-01', nombre: 'Switch ATEM Mini Pro ISO', categoria: 'SWITCH_VIDEO', marca: 'Blackmagic', modelo: 'Mini Pro ISO', valor_compra: 780000, kit: 'k1' },

  { codigo: 'CS-CAM-02', nombre: 'Cámara Sony PXW-Z90', categoria: 'CAMARA', marca: 'Sony', modelo: 'PXW-Z90', valor_compra: 2300000, kit: 'k2' },
  { codigo: 'CS-TRI-02', nombre: 'Trípode Manfrotto 502', categoria: 'TRIPODE', marca: 'Manfrotto', modelo: '502', valor_compra: 310000, kit: 'k2' },
  { codigo: 'CS-MIC-02', nombre: 'Micrófono Rode NTG4+', categoria: 'MICROFONO', marca: 'Rode', modelo: 'NTG4+', valor_compra: 260000, kit: 'k2' },
  { codigo: 'CS-SWI-02', nombre: 'Switch Roland V-02HD', categoria: 'SWITCH_VIDEO', marca: 'Roland', modelo: 'V-02HD', valor_compra: 520000, kit: 'k2' },

  // Kit 03: la cámara se perdió en el caso C14 (queda dada de baja y el kit INCOMPLETO)
  { codigo: 'CS-CAM-03', nombre: 'Cámara Canon XA60', categoria: 'CAMARA', marca: 'Canon', modelo: 'XA60', valor_compra: 1200000, kit: 'k3', estado: 'DADO_DE_BAJA' },
  { codigo: 'CS-TRI-03', nombre: 'Trípode Benro S8 Pro', categoria: 'TRIPODE', marca: 'Benro', modelo: 'S8 Pro', valor_compra: 380000, kit: 'k3' },
  { codigo: 'CS-MIC-03', nombre: 'Micrófono Shure VP83F', categoria: 'MICROFONO', marca: 'Shure', modelo: 'VP83F', valor_compra: 330000, kit: 'k3' },
  { codigo: 'CS-SWI-03', nombre: 'Switch ATEM Mini Extreme', categoria: 'SWITCH_VIDEO', marca: 'Blackmagic', modelo: 'Mini Extreme', valor_compra: 1100000, kit: 'k3' },

  // Repuesto suelto: sirve para reemplazar la cámara perdida del Kit 03
  { codigo: 'CS-REP-CAM', nombre: 'Cámara repuesto Canon XA40', categoria: 'CAMARA', marca: 'Canon', modelo: 'XA40', valor_compra: 950000, kit: null },
];

const AUSPICIADORES = {
  cafe: { nombre: 'Café Puerto Sur', rubro: 'Cafetería', contacto: 'Rocío Medina', telefono: '+56981110001' },
  radio: { nombre: 'Radio Bío Sonora', rubro: 'Radio', contacto: 'Hugo Saavedra', telefono: '+56981110002' },
  rapidas: {
    nombre: 'Inversiones Rápidas Ltda.', rubro: 'Préstamos', contacto: 'Mauricio Leiva', telefono: '+56981110003',
    clasificacion: 'NO_CONFIABLE', motivo_clasificacion: 'Prometió un aporte en dinero y no pagó en la fecha comprometida.',
  },
};

const GASTOS_FIJOS = [
  { descripcion: 'Arriendo de bodega de equipos', monto: 350000 },
  { descripcion: 'Internet y plataforma de streaming', monto: 45000 },
];

// Usuarios para probar el inicio de sesión (contraseña 123456)
const USUARIOS_LOGIN = {
  bloqueado: { nombre: 'Carla Bloqueada', correo: 'bloqueado@sixseven.cl' },
  inactivo: { nombre: 'Iván Inactivo', correo: 'inactivo@sixseven.cl' },
};

// ---------------------------------------------------------------------------
//  Los casos. Cada evento: datos + qué probar (va en la observación, máx. 255).
//  personal: [trabajador, rol, porcentaje|null, estado_rendicion, estado_pago]
//  pagos: [tipo, monto, día relativo]
// ---------------------------------------------------------------------------
const D = {
  c01: diaRel(5), c02: diaRel(7), c03: diaRel(9), c04: diaRel(12), c05: diaRel(14),
  c08: diaRel(0), c09: diaRel(-1), c10: diaRel(-2), c11: diaRel(-3), c12: diaRel(-4), c13: diaRel(-6), c14: diaRel(-8),
};

const EVENTOS = [
  // ===================== AGENDA (Dueño) =====================
  {
    id: 'c01', cliente: 'rugby', tipo: 'C01 · Partido amistoso', fecha: D.c01, ini: '10:00', fin: '12:00',
    dir: 'Estadio Municipal, Concepción', precio: 180000, estado: 'CONFIRMADO',
    nota: 'Evento vacío. Prueba: asignar a Ana (disponible), asignar el Kit Casos 01, intentar el Kit Casos 03 (incompleto: debe fallar), agregar auspiciador, convocatoria, modificar y eliminar con motivo.',
  },
  {
    id: 'c02', cliente: 'andes', tipo: 'C02 · Matrimonio', fecha: D.c02, ini: '14:00', fin: '21:00',
    dir: 'Viña Santa Cruz, Chiguayante', precio: 600000, estado: 'PENDIENTE_ADELANTO',
    nota: 'Dura 7 h y no tiene pagos. Contador: registrar ADELANTO de $300.000 → debe pasar a Confirmado. Tiene un acuerdo VENCIDO (Inversiones Rápidas) para declarar incobrable.',
  },
  {
    id: 'c03', cliente: 'cultura', tipo: 'C03 · Feria costumbrista', fecha: D.c03, ini: '09:00', fin: '15:00',
    dir: 'Plaza de Armas, Penco', precio: 500000, estado: 'PENDIENTE_ADELANTO',
    pagos: [['ADELANTO', 100000, -1]],
    nota: 'Adelanto de $100.000 (no alcanza el 50%). Contador: un SALDO menor a lo que falta debe rechazarse; otro ADELANTO de $150.000 llega a $250.000 (50%) y debe pasar a Confirmado.',
  },

  // ---- C04: un día con 4 eventos (botón "+2 más" en la vista Mes) ----
  { id: 'c04a', cliente: 'robles', tipo: 'C04 · Charla de orientación', fecha: D.c04, ini: '08:00', fin: '10:00', dir: 'Colegio Los Robles, San Pedro de la Paz', precio: 120000, estado: 'CONFIRMADO',
    nota: 'Día con 4 eventos: en la vista Mes deben verse 2 y el botón "+2 más". Prueba también la vista Semana.' },
  { id: 'c04b', cliente: 'cultura', tipo: 'C04 · Seminario de cultura', fecha: D.c04, ini: '11:00', fin: '13:00', dir: 'Teatro Municipal, Penco', precio: 160000, estado: 'CONFIRMADO',
    nota: 'Día con 4 eventos (ver C04 · Charla de orientación).' },
  { id: 'c04c', cliente: 'robles', tipo: 'C04 · Torneo escolar', fecha: D.c04, ini: '15:00', fin: '17:00', dir: 'Gimnasio Colegio Los Robles, San Pedro de la Paz', precio: 140000, estado: 'CONFIRMADO',
    nota: 'Día con 4 eventos (ver C04 · Charla de orientación).' },
  { id: 'c04d', cliente: 'andes', tipo: 'C04 · Concierto de bandas', fecha: D.c04, ini: '19:00', fin: '22:00', dir: 'Teatro Biobío, Concepción', precio: 450000, estado: 'CONFIRMADO',
    nota: 'Tiene un acuerdo PENDIENTE con Café Puerto Sur ($150.000). Contador: registrar el aporte recibido → debe quedar Cumplido.' },

  // ---- C05: margen de traslado y traslapes (mismo día) ----
  {
    id: 'c05a', cliente: 'rugby', tipo: 'C05 · Final de básquetbol', fecha: D.c05, ini: '10:00', fin: '12:00',
    dir: 'Gimnasio Municipal, Concepción', precio: 300000, estado: 'CONFIRMADO',
    personal: [['bruno', 'son']], kits: ['k1'],
    nota: 'Bruno Díaz y el Kit Casos 01 ya están aquí. Personal disponible (10:00-12:00): Bruno Ocupado, Ana Disponible, Daniela/Gonzalo Sin disponibilidad, Esteban En licencia, Fernanda Inactivo.',
  },
  {
    id: 'c05b', cliente: 'cultura', tipo: 'C05 · Charla en Talcahuano', fecha: D.c05, ini: '12:30', fin: '14:00',
    dir: 'Centro Cultural, Talcahuano', precio: 150000, estado: 'CONFIRMADO',
    nota: 'Asignar a Bruno o el Kit Casos 01: se permite, pero debe AVISAR margen de traslado (30 min < 60). Si bajas el margen a 20 min en Herramientas, el aviso desaparece.',
  },
  {
    id: 'c05c', cliente: 'robles', tipo: 'C05 · Clínica deportiva', fecha: D.c05, ini: '11:00', fin: '13:00',
    dir: 'Estadio Collao, Concepción', precio: 130000, estado: 'CONFIRMADO',
    nota: 'Se traslapa con la Final de básquetbol: asignar a Bruno o el Kit Casos 01 debe dar ERROR (no solo aviso).',
  },

  // ===================== DÍA DEL EVENTO (Jefe técnico) =====================
  {
    id: 'c08', cliente: 'andes', tipo: 'C08 · Transmisión de hoy', fecha: D.c08, ini: '15:00', fin: '23:00',
    dir: 'Arena Sur, Talcahuano', precio: 420000, estado: 'CONFIRMADO',
    pagos: [['PAGO_TOTAL', 420000, -2]], personal: [['ana', 'cam'], ['bruno', 'son']], kits: ['k1'],
    nota: 'Es HOY. Jefe técnico: registrar la SALIDA del Kit Casos 01 con Ana como responsable → el kit queda En terreno.',
  },

  // ===================== DESPUÉS DEL EVENTO =====================
  {
    id: 'c09', cliente: 'rugby', tipo: 'C09 · Partido de ayer', fecha: D.c09, ini: '10:00', fin: '12:00',
    dir: 'Cancha Lomas, Concepción', precio: 200000, estado: 'CONFIRMADO',
    pagos: [['PAGO_TOTAL', 200000, -5]], personal: [['ana', 'cam'], ['daniela', 'asis']],
    nota: 'Ya terminó y sigue Confirmado (aparece como alerta en el panel del Dueño). Dueño: MARCAR COMO REALIZADO → las rendiciones de Ana y Daniela quedan Pendientes.',
  },
  {
    id: 'c10', cliente: 'cultura', tipo: 'C10 · Kit sin retorno', fecha: D.c10, ini: '09:00', fin: '13:00',
    dir: 'Parque Costanera, Penco', precio: 350000, estado: 'REALIZADO',
    pagos: [['PAGO_TOTAL', 350000, -9]],
    personal: [['bruno', 'son', 15, 'PENDIENTE'], ['ana', 'cam', 20, 'SIN_GASTOS']],
    salidas: [{ kit: 'k2', responsable: 'bruno', sale: '08:00' }],
    nota: 'El Kit Casos 02 salió hace 2 días y no vuelve: alerta en el panel del Jefe. Jefe: registrar RETORNO con el micrófono CS-MIC-02 Dañado ($60.000) → incidente y kit Incompleto. Cierre: avisa kit y rendición pendientes.',
  },

  // ===================== CIERRE (Contador y Dueño) =====================
  {
    id: 'c11', cliente: 'andes', tipo: 'C11 · Congreso regional', fecha: D.c11, ini: '09:00', fin: '18:00',
    dir: 'Hotel Sonesta, Concepción', precio: 400000, estado: 'REALIZADO',
    pagos: [['ADELANTO', 200000, -10]],
    personal: [['ana', 'cam', null, 'PENDIENTE'], ['bruno', 'son', null, 'PENDIENTE'], ['daniela', 'asis', null, 'PENDIENTE']],
    nota: 'Falta todo el cierre: Contador registra SALDO $200.000, un gasto de Daniela con boleta y las rendiciones. Dueño define % (Ana 20, Bruno 15, Daniela 10). Sin % el cierre debe bloquearse.',
  },
  {
    id: 'c12', cliente: 'robles', tipo: 'C12 · Gala lista para cerrar', fecha: D.c12, ini: '19:00', fin: '23:00',
    dir: 'Salón Los Robles, San Pedro de la Paz', precio: 500000, estado: 'REALIZADO',
    pagos: [['PAGO_TOTAL', 500000, -12]],
    personal: [['ana', 'cam', 20, 'RENDIDA'], ['bruno', 'son', 15, 'SIN_GASTOS']],
    gastos: [
      { quien: 'ana', tipo_gasto: 'MOVILIZACION', monto: 12000, descripcion: 'Uber ida y vuelta al salón', origen: 'Concepción', destino: 'San Pedro de la Paz' },
      { quien: 'ana', tipo_gasto: 'ALIMENTACION', monto: 8500, descripcion: 'Colación durante el montaje' },
    ],
    salidas: [{ kit: 'k1', responsable: 'ana', sale: '17:30', vuelve: '23:45' }],
    nota: 'Todo listo. Dueño: CERRAR JORNADA → resultado $384.500 (500.000 + 80.000 aporte − 175.000 remuneraciones − 20.500 gastos). Luego el Contador paga las remuneraciones.',
  },
  {
    id: 'c13', cliente: 'rugby', tipo: 'C13 · Cerrado por pagar', fecha: D.c13, ini: '16:00', fin: '18:00',
    dir: 'Estadio Municipal, Concepción', precio: 300000, estado: 'CERRADO',
    pagos: [['PAGO_TOTAL', 300000, -7]],
    personal: [['ana', 'cam', 25, 'SIN_GASTOS', 'POR_PAGAR'], ['daniela', 'asis', 10, 'SIN_GASTOS', 'PAGADA']],
    nota: 'Cerrado con resultado $195.000. Daniela ya está pagada; Contador: registrar el PAGO DE REMUNERACIÓN de Ana ($75.000). Ya no debe permitir cambiar porcentajes, kits ni personal.',
  },
  {
    id: 'c14', cliente: 'cultura', tipo: 'C14 · Cerrado con pérdida', fecha: D.c14, ini: '18:00', fin: '21:00',
    dir: 'Muelle Histórico, Penco', precio: 250000, estado: 'CERRADO',
    pagos: [['ADELANTO', 125000, -15]],
    personal: [['bruno', 'son', 20, 'SIN_GASTOS'], ['ana', 'cam', 20, 'SIN_GASTOS']],
    salidas: [{ kit: 'k3', responsable: 'bruno', sale: '16:30', vuelve: '22:30', perdido: 'CS-CAM-03' }],
    nota: 'Se perdió la cámara CS-CAM-03 ($1.200.000): resultado −$1.175.000. Revisar pérdidas en Finanzas e Inventario e historial del equipo. El Kit Casos 03 quedó Incompleto.',
  },
];

// Acuerdos de auspicio
const ACUERDOS = [
  { evento: 'c04d', auspiciador: 'cafe', glosa: 'Mención en pantalla y logo durante el concierto', tipo_aporte: 'DINERO', monto: 150000, menciones: 4, fecha: 10, estado: 'PENDIENTE' },
  { evento: 'c02', auspiciador: 'rapidas', glosa: 'Logo en la transmisión del matrimonio', tipo_aporte: 'DINERO', monto: 200000, menciones: 2, fecha: -5, estado: 'VENCIDO' },
  { evento: 'c12', auspiciador: 'radio', glosa: 'Canje: difusión radial de la gala', tipo_aporte: 'CANJE', monto: 80000, canje: '10 frases radiales de 30 segundos', menciones: 3, fecha: -6, estado: 'CUMPLIDO', recibido: [80000, -5] },
];

// ---------------------------------------------------------------------------
//  Limpieza de los casos anteriores (para que correrlo de nuevo los reinicie)
// ---------------------------------------------------------------------------
async function borrarCasosAnteriores() {
  const eventos = await prisma.evento.findMany({ where: { observaciones: { startsWith: MARCA } }, select: { id_evento: true } });
  const ids = eventos.map((e) => e.id_evento);
  const deEvento = { id_evento: { in: ids } };
  const codigos = EQUIPOS.map((e) => e.codigo);
  const nombresKits = Object.values(KITS).map((k) => k.nombre);
  const nombresTrab = Object.values(TRABAJADORES).map((t) => t.nombre);

  await prisma.$transaction([
    prisma.pagoCliente.deleteMany({ where: deEvento }),
    prisma.gastoEvento.deleteMany({ where: { asignacion: deEvento } }),
    prisma.pagoRemuneracion.deleteMany({ where: { asignacion: deEvento } }),
    prisma.salidaKit.deleteMany({ where: { OR: [{ reserva: deEvento }, { reserva: { kit: { nombre: { in: nombresKits } } } }] } }),
    prisma.acuerdoAuspicio.deleteMany({ where: deEvento }), // sus aportes se borran en cascada
    prisma.incidente.deleteMany({ where: { OR: [deEvento, { codigo: { in: codigos } }] } }),
    prisma.asignacionPersonal.deleteMany({ where: deEvento }),
    prisma.reservaKit.deleteMany({ where: { OR: [deEvento, { kit: { nombre: { in: nombresKits } } }] } }),
    prisma.historialCambio.updateMany({ where: deEvento, data: { id_evento: null } }),
    prisma.evento.deleteMany({ where: deEvento }),
    prisma.revisa.deleteMany({ where: { codigo: { in: codigos } } }),
    prisma.equipo.deleteMany({ where: { codigo: { in: codigos } } }),
    prisma.kit.deleteMany({ where: { nombre: { in: nombresKits } } }),
    prisma.cliente.deleteMany({ where: { rut: { in: Object.values(CLIENTES).map((c) => c.rut) }, eventos: { none: {} } } }),
    prisma.acuerdoAuspicio.deleteMany({ where: { auspiciador: { nombre: { in: Object.values(AUSPICIADORES).map((a) => a.nombre) } } } }),
    prisma.auspiciador.deleteMany({ where: { nombre: { in: Object.values(AUSPICIADORES).map((a) => a.nombre) }, acuerdos: { none: {} } } }),
  ]);

  // Trabajadores de los casos (si alguien los usó en eventos creados a mano, se conservan)
  for (const nombre of nombresTrab) {
    const t = await prisma.trabajador.findFirst({ where: { nombre }, include: { _count: { select: { asignaciones: true } } } });
    if (!t) continue;
    if (t._count.asignaciones > 0) {
      console.log(`  - Se conserva a ${nombre}: está asignado a eventos creados a mano`);
      continue;
    }
    await prisma.incidente.updateMany({ where: { id_trabajador: t.id_trabajador }, data: { id_trabajador: null } });
    await prisma.trabajador.delete({ where: { id_trabajador: t.id_trabajador } }); // disponibilidad y roles se borran en cascada
  }
  return ids.length;
}

// Archivo de evidencia de ejemplo (un PNG de 1×1) para los gastos sembrados
function crearEvidencia(nombre) {
  const carpeta = new URL('../uploads/evidencias/', import.meta.url);
  fs.mkdirSync(carpeta, { recursive: true });
  const archivo = new URL(nombre, carpeta);
  if (!fs.existsSync(archivo)) {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    fs.writeFileSync(archivo, png);
  }
  return `uploads/evidencias/${nombre}`;
}

// ---------------------------------------------------------------------------
//  Creación
// ---------------------------------------------------------------------------
async function main() {
  // Usuarios: preferimos los "oficiales" de los seeders y, si no están, el primero que exista
  const dueno =
    (await prisma.dueno.findUnique({ where: { correo: 'admin@demo.com' } })) ?? (await prisma.dueno.findFirst());
  if (!dueno) throw new Error('No existe ningún dueño. Ejecuta primero: npm run seed:base');
  const contador =
    (await prisma.contador.findUnique({ where: { correo: 'contador@sixseven.cl' } })) ?? (await prisma.contador.findFirst());
  if (!contador) throw new Error('No existe ningún contador. Ejecuta primero: npm run seed:usuarios');
  const jefe =
    (await prisma.jefeAreaTecnica.findUnique({ where: { correo: 'jefe@sixseven.cl' } })) ??
    (await prisma.jefeAreaTecnica.findFirst());
  if (!jefe) throw new Error('No existe ningún jefe técnico. Ejecuta primero: npm run seed:usuarios');

  const borrados = await borrarCasosAnteriores();
  if (borrados > 0) console.log(`Casos anteriores reiniciados (${borrados} eventos borrados)`);

  // El margen de traslado vuelve a 60 min para que el caso C05 dé el aviso esperado
  await prisma.dueno.update({ where: { id_dueno: dueno.id_dueno }, data: { margen_traslado_min: 60 } });

  // ---- Clientes ----
  const cli = {};
  for (const [clave, c] of Object.entries(CLIENTES)) {
    cli[clave] =
      (await prisma.cliente.findUnique({ where: { rut: c.rut } })) ??
      (await prisma.cliente.create({ data: { ...c, id_dueno: dueno.id_dueno } }));
  }

  // ---- Roles (se reutilizan si ya existen: el nombre es único) ----
  const rol = {};
  for (const [clave, nombre] of Object.entries(ROLES)) {
    rol[clave] =
      (await prisma.rolTrabajo.findFirst({ where: { nombre } })) ??
      (await prisma.rolTrabajo.create({ data: { nombre, porcentaje_referencial: PCT_REFERENCIAL[clave], id_dueno: dueno.id_dueno } }));
  }

  // ---- Trabajadores, sus roles y su disponibilidad ----
  const trab = {};
  for (const [clave, t] of Object.entries(TRABAJADORES)) {
    trab[clave] =
      (await prisma.trabajador.findFirst({ where: { nombre: t.nombre } })) ??
      (await prisma.trabajador.create({
        data: {
          nombre: t.nombre,
          telefono_whatsapp: t.telefono_whatsapp,
          correo: t.correo ?? null,
          estado: t.estado ?? 'ACTIVO',
          id_dueno: dueno.id_dueno,
        },
      }));
    await prisma.desempena.createMany({
      data: t.roles.map((r) => ({ id_trabajador: trab[clave].id_trabajador, id_rol: rol[r].id_rol })),
      skipDuplicates: true,
    });
    await prisma.disponibilidad.deleteMany({ where: { id_trabajador: trab[clave].id_trabajador } });
    if (t.disp) {
      await prisma.disponibilidad.create({
        data: {
          id_trabajador: trab[clave].id_trabajador,
          nro_bloque: 1,
          fecha_inicio: fechaDB(diaRel(t.disp[0])),
          fecha_termino: fechaDB(diaRel(t.disp[1])),
          id_dueno: dueno.id_dueno,
        },
      });
    }
  }

  // ---- Kits y equipos ----
  const kit = {};
  for (const [clave, k] of Object.entries(KITS)) {
    kit[clave] = await prisma.kit.create({ data: { ...k, id_jefe: jefe.id_jefe } });
  }
  for (const eq of EQUIPOS) {
    await prisma.equipo.create({
      data: {
        codigo: eq.codigo,
        nombre: eq.nombre,
        categoria: eq.categoria,
        marca: eq.marca,
        modelo: eq.modelo,
        valor_compra: eq.valor_compra,
        fecha_compra: fechaDB(diaRel(-200)),
        estado: eq.estado ?? 'OPERATIVO',
        fecha_baja: eq.estado === 'DADO_DE_BAJA' ? fechaDB(D.c14) : null,
        motivo_baja: eq.estado === 'DADO_DE_BAJA' ? 'Perdida en el evento C14 · Cerrado con pérdida' : null,
        id_kit: eq.kit ? kit[eq.kit].id_kit : null,
        id_jefe: jefe.id_jefe,
      },
    });
  }

  // ---- Auspiciadores ----
  const ausp = {};
  for (const [clave, a] of Object.entries(AUSPICIADORES)) {
    ausp[clave] =
      (await prisma.auspiciador.findFirst({ where: { nombre: a.nombre, id_dueno: dueno.id_dueno } })) ??
      (await prisma.auspiciador.create({ data: { clasificacion: 'CONFIABLE', ...a, id_dueno: dueno.id_dueno } }));
  }

  // ---- Eventos (cada uno completo en una transacción) ----
  const ev = {};
  const evidencias = [crearEvidencia('caso-boleta-movilizacion.png'), crearEvidencia('caso-boleta-alimentacion.png')];

  for (const e of EVENTOS) {
    const personal = (e.personal ?? []).map(([quien, r, pct = null, rendicion = null, pago = 'POR_PAGAR']) => ({
      quien, r, pct, rendicion, pago,
      monto: pct === null ? null : remuneracion(pct, e.precio),
    }));

    ev[e.id] = await prisma.$transaction(async (tx) => {
      const evento = await tx.evento.create({
        data: {
          tipo: e.tipo,
          fecha: fechaDB(e.fecha),
          hora_inicio: horaDB(e.ini),
          hora_termino: horaDB(e.fin),
          direccion: e.dir,
          precio_acordado: e.precio,
          observaciones: `${MARCA} ${e.nota}`.slice(0, 255),
          estado: e.estado,
          id_cliente: cli[e.cliente].id_cliente,
          id_dueno: dueno.id_dueno,
        },
      });

      for (const [tipo_pago, monto, dia] of e.pagos ?? []) {
        await tx.pagoCliente.create({
          data: { tipo_pago, monto, fecha: fechaDB(diaRel(dia)), medio_pago: 'Transferencia', id_evento: evento.id_evento, id_contador: contador.id_contador },
        });
      }

      const asig = {};
      for (const p of personal) {
        asig[p.quien] = await tx.asignacionPersonal.create({
          data: {
            id_evento: evento.id_evento,
            id_trabajador: trab[p.quien].id_trabajador,
            id_rol: rol[p.r].id_rol,
            id_dueno: dueno.id_dueno,
            porcentaje: p.pct,
            remuneracion: p.monto,
            estado_rendicion: p.rendicion,
            estado_pago: p.pago,
          },
        });
        if (p.pago === 'PAGADA') {
          await tx.pagoRemuneracion.create({
            data: { fecha: fechaDB(diaRel(-3)), monto: p.monto, medio_pago: 'Transferencia', id_asignacion: asig[p.quien].id_asignacion, id_contador: contador.id_contador },
          });
        }
      }

      (e.gastos ?? []).forEach((g, i) => (g.evidencia = evidencias[i % evidencias.length]));
      for (const g of e.gastos ?? []) {
        await tx.gastoEvento.create({
          data: {
            tipo_gasto: g.tipo_gasto, monto: g.monto, fecha: fechaDB(e.fecha), descripcion: g.descripcion,
            origen: g.origen ?? null, destino: g.destino ?? null, evidencia: g.evidencia,
            id_asignacion: asig[g.quien].id_asignacion, id_contador: contador.id_contador,
          },
        });
      }

      // Kits reservados (sin salida todavía)
      for (const k of e.kits ?? []) {
        await tx.reservaKit.create({ data: { id_evento: evento.id_evento, id_kit: kit[k].id_kit, id_dueno: dueno.id_dueno } });
      }

      // Kits que ya salieron (y, si corresponde, volvieron con su revisión)
      let perdidas = 0;
      for (const s of e.salidas ?? []) {
        const reserva = await tx.reservaKit.create({ data: { id_evento: evento.id_evento, id_kit: kit[s.kit].id_kit, id_dueno: dueno.id_dueno } });
        const salida = await tx.salidaKit.create({
          data: {
            id_reserva: reserva.id_reserva,
            id_asignacion: asig[s.responsable].id_asignacion,
            id_jefe: jefe.id_jefe,
            fecha_hora_salida: momento(e.fecha, s.sale),
            fecha_hora_retorno: s.vuelve ? momento(e.fecha, s.vuelve) : null,
          },
        });
        if (s.vuelve) {
          for (const eq of EQUIPOS.filter((x) => x.kit === s.kit)) {
            const perdido = eq.codigo === s.perdido;
            await tx.revisa.create({
              data: {
                id_salida: salida.id_salida, codigo: eq.codigo,
                estado_retorno: perdido ? 'PERDIDO' : 'OPERATIVO',
                observacion: perdido ? 'No volvió del evento: se presume extraviada en el montaje' : null,
              },
            });
            if (perdido) {
              perdidas += eq.valor_compra;
              await tx.incidente.create({
                data: {
                  tipo: 'PERDIDA', fecha: fechaDB(e.fecha), valor: eq.valor_compra, codigo: eq.codigo,
                  descripcion: 'Cámara extraviada durante el desmontaje del evento',
                  id_evento: evento.id_evento, id_trabajador: trab[s.responsable].id_trabajador, id_jefe: jefe.id_jefe,
                },
              });
            }
          }
        }
      }

      // Jornada cerrada: se fija la rentabilidad igual que cierre.service.js
      if (e.estado === 'CERRADO') {
        const pagado = (e.pagos ?? []).reduce((s, [, m]) => s + m, 0);
        const rem = personal.reduce((s, p) => s + (p.monto ?? 0), 0);
        const gastos = (e.gastos ?? []).reduce((s, g) => s + g.monto, 0);
        await tx.evento.update({
          where: { id_evento: evento.id_evento },
          data: { rentabilidad_final: pagado - rem - gastos - perdidas, fecha_cierre: momento(e.fecha, '23:59') },
        });
      }
      return evento;
    });
  }

  // ---- Acuerdos de auspicio ----
  for (const a of ACUERDOS) {
    const acuerdo = await prisma.acuerdoAuspicio.create({
      data: {
        glosa: a.glosa, tipo_aporte: a.tipo_aporte, monto_comprometido: a.monto,
        descripcion_canje: a.canje ?? null, cant_menciones: a.menciones,
        fecha_comprometida: fechaDB(diaRel(a.fecha)), estado: a.estado,
        id_auspiciador: ausp[a.auspiciador].id_auspiciador, id_evento: ev[a.evento].id_evento, id_dueno: dueno.id_dueno,
      },
    });
    if (a.recibido) {
      await prisma.cumplimientoAporte.create({
        data: { id_acuerdo: acuerdo.id_acuerdo, nro_cumplimiento: 1, fecha: fechaDB(diaRel(a.recibido[1])), monto_recibido: a.recibido[0], id_contador: contador.id_contador },
      });
    }
  }

  // ---- Gastos fijos del mes actual (si el mes no está cerrado) ----
  const anio = HOY.getFullYear();
  const mes = HOY.getMonth() + 1;
  const mesContable =
    (await prisma.mesContable.findUnique({ where: { anio_mes: { anio, mes } } })) ??
    (await prisma.mesContable.create({ data: { anio, mes } }));
  if (mesContable.estado === 'ABIERTO') {
    for (const g of GASTOS_FIJOS) {
      const existe = await prisma.gastoFijo.findFirst({ where: { id_mes: mesContable.id_mes, descripcion: g.descripcion } });
      if (!existe) {
        await prisma.gastoFijo.create({ data: { ...g, id_mes: mesContable.id_mes, id_contador: contador.id_contador } });
      }
    }
  }

  // ---- Usuarios para probar el inicio de sesión ----
  const hash = await bcrypt.hash('123456', 10);
  const enUnaSemana = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.contador.upsert({
    where: { correo: USUARIOS_LOGIN.bloqueado.correo },
    update: { contrasena: hash, estado: 'ACTIVO', intentos_fallidos: 0, bloqueado_hasta: enUnaSemana },
    create: { ...USUARIOS_LOGIN.bloqueado, contrasena: hash, estado: 'ACTIVO', bloqueado_hasta: enUnaSemana },
  });
  await prisma.contador.upsert({
    where: { correo: USUARIOS_LOGIN.inactivo.correo },
    update: { contrasena: hash, estado: 'INACTIVO', intentos_fallidos: 0, bloqueado_hasta: null },
    create: { ...USUARIOS_LOGIN.inactivo, contrasena: hash, estado: 'INACTIVO' },
  });

  // ---- Resumen ----
  console.log('');
  console.log('Casos de prueba listos (contraseña de todos los usuarios: 123456)');
  console.log(`  Dueño: ${dueno.correo} · Contador: ${contador.correo} · Jefe técnico: ${jefe.correo}`);
  console.log('');
  for (const e of EVENTOS) console.log(`  ${diaLegible(e.fecha)}  ${e.tipo.padEnd(34)} ${e.estado}`);
  console.log('');
  console.log(`  Clientes: ${Object.keys(CLIENTES).length} (uno sin eventos) · Trabajadores: ${Object.keys(TRABAJADORES).length} · Kits: 3 · Auspiciadores: 3 · Acuerdos: ${ACUERDOS.length}`);
  console.log(`  Login: ${USUARIOS_LOGIN.bloqueado.correo} (bloqueado) · ${USUARIOS_LOGIN.inactivo.correo} (inactivo)`);
}

main()
  .catch((e) => {
    console.error('Error al crear los casos de prueba:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());