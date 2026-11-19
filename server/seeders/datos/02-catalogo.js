// ============================================================================
//  2. CATÁLOGO: roles, personal (con sus roles y disponibilidad), clientes,
//     auspiciadores, kits y equipos. Todo lo que usan los eventos sale de aquí.
// ============================================================================
import { prisma, dia, fechaDB, rut } from '../lib/base.js';

// ---- Roles de trabajo (porcentaje referencial que el sistema propone) ----
export const ROLES = {
  cam: { nombre: 'Camarógrafo Principal', pct: 20 },
  son: { nombre: 'Operador de Sonido', pct: 15 },
  swi: { nombre: 'Operador de Switch', pct: 15 },
  asis: { nombre: 'Asistente de Transmisión', pct: 10 },
};

// ---- Personal ----
// disp: bloques de disponibilidad [desde, hasta] en días relativos a hoy.
// Todos tienen disponibilidad salvo los que existen justamente para probar ese caso.
export const TRABAJADORES = {
  carlos: { nombre: 'Carlos Carrasco', telefono_whatsapp: '+56912345678', correo: 'carlos@sixseven.cl', roles: ['cam', 'swi'], disp: [[-150, 150]] },
  sebastian: { nombre: 'Sebastián Morales', telefono_whatsapp: '+56987654321', correo: 'sebastian@sixseven.cl', roles: ['son', 'cam'], disp: [[-150, 150]] },
  valentina: { nombre: 'Valentina Henríquez', telefono_whatsapp: '+56955443322', correo: 'valentina@sixseven.cl', roles: ['asis', 'son'], disp: [[-150, 150]] },
  ana: { nombre: 'Ana Fuentes', telefono_whatsapp: '+56971110001', correo: 'ana@sixseven.cl', roles: ['cam', 'son'], disp: [[-150, 150]] },
  bruno: { nombre: 'Bruno Díaz', telefono_whatsapp: '+56971110002', correo: 'bruno@sixseven.cl', roles: ['son', 'cam'], disp: [[-150, 150]] },
  // Dos bloques con un hueco (vacaciones): sin disponibilidad desde hace 5 días hasta dentro de 20
  matias: { nombre: 'Matías Soto', telefono_whatsapp: '+56987654324', correo: 'matias@sixseven.cl', roles: ['swi', 'asis'], disp: [[-150, -5], [20, 150]] },
  // Disponible recién desde dentro de 20 días
  gonzalo: { nombre: 'Gonzalo Paz', telefono_whatsapp: '+56971110004', roles: ['cam'], disp: [[20, 90]] },
  // Registró disponibilidad solo hasta ayer (trabajó en C09, C11 y C13): desde hoy no tiene,
  // así que al asignarla a un evento futuro el sistema avisa (caso de prueba)
  daniela: { nombre: 'Daniela Rojas', telefono_whatsapp: '+56971110003', roles: ['asis'], disp: [[-30, -1]] },
  esteban: { nombre: 'Esteban Mora', telefono_whatsapp: '+56971110005', roles: ['son'], disp: [[-150, 150]], estado: 'LICENCIA' },
  fernanda: { nombre: 'Fernanda Ruiz', telefono_whatsapp: '+56971110006', roles: ['asis'], disp: [[-150, 150]], estado: 'INACTIVO' },
};

// ---- Clientes (RUT con dígito verificador válido) ----
export const CLIENTES = {
  andes: { rut: '111111111', nombre: 'Club Deportivo Los Andes', contacto: 'Roberto Paredes', telefono: '+56911111111', correo: 'contacto@losandes.cl' },
  muni: { rut: '123456785', nombre: 'Municipalidad de Prueba', contacto: 'Claudia Navarrete', telefono: '+56922222222', correo: 'eventos@muniprueba.cl' },
  sanmartin: { rut: '152345674', nombre: 'Colegio San Martín', contacto: 'Jorge Espinoza', telefono: '+56933333333' },
  sur: { rut: '178901230', nombre: 'Productora Sur Eventos', contacto: 'Daniela Vidal', telefono: '+56944444444', correo: 'contacto@surevento.cl' },
  liga: { rut: '187654327', nombre: 'Liga Universitaria', contacto: 'Andrea Muñoz', telefono: '+56955555555', correo: 'liga@universitaria.cl' },
  rugby: { rut: rut('76543210'), nombre: 'Club de Rugby Lomas', contacto: 'Felipe Urrutia', telefono: '+56961112233', correo: 'contacto@rugbylomas.cl' },
  cultura: { rut: rut('65432109'), nombre: 'Corporación Cultural Penco', contacto: 'María José Lagos', telefono: '+56962223344', correo: 'cultura@penco.cl' },
  andeslive: { rut: rut('77889900'), nombre: 'Productora Andes Live', contacto: 'Tomás Vera', telefono: '+56963334455', correo: 'eventos@andeslive.cl' },
  robles: { rut: rut('81234567'), nombre: 'Colegio Los Robles', contacto: 'Patricia Soto', telefono: '+56964445566' },
  // Sin eventos: el único cliente que se puede eliminar (caso de prueba)
  junta: { rut: rut('65111222'), nombre: 'Junta de Vecinos Pedro de Valdivia', contacto: 'Luis Cárcamo', telefono: '+56965556677' },
};

// ---- Auspiciadores ----
const noConfiable = (motivo) => ({ clasificacion: 'NO_CONFIABLE', motivo_clasificacion: motivo });
export const AUSPICIADORES = {
  cocacola: { nombre: 'Coca-Cola', rubro: 'Bebidas', contacto: 'Andrea Fuentes', telefono: '+56911000001' },
  pepsi: { nombre: 'Pepsi', rubro: 'Bebidas', contacto: 'Camila Vergara', telefono: '+56911000005' },
  gatorade: { nombre: 'Gatorade', rubro: 'Bebidas deportivas', contacto: 'Matías Rojas', telefono: '+56911000002' },
  powerade: { nombre: 'Powerade', rubro: 'Bebidas deportivas', contacto: 'Daniela Pino', telefono: '+56911000003' },
  redbull: { nombre: 'Red Bull', rubro: 'Bebidas energéticas', contacto: 'Nicolás Soto', telefono: '+56911000006' },
  monster: { nombre: 'Monster Energy', rubro: 'Bebidas energéticas', contacto: 'Javiera Contreras', telefono: '+56911000007' },
  adidas: { nombre: 'Adidas', rubro: 'Ropa deportiva', contacto: 'Sebastián Muñoz', telefono: '+56911000008' },
  nike: { nombre: 'Nike', rubro: 'Ropa deportiva', contacto: 'Valentina Gaete', telefono: '+56911000009' },
  netflix: { nombre: 'Netflix', rubro: 'Streaming', contacto: 'Felipe Araya', telefono: '+56911000004' },
  spotify: { nombre: 'Spotify', rubro: 'Streaming de música', contacto: 'Francisca Lagos', telefono: '+56911000010' },
  entel: { nombre: 'Entel', rubro: 'Telecomunicaciones', contacto: 'Rodrigo Parra', telefono: '+56911000011' },
  bancoestado: { nombre: 'BancoEstado', rubro: 'Banca', contacto: 'Paula Henríquez', telefono: '+56911000012' },
  espiga: { nombre: 'Panadería La Espiga', rubro: 'Panadería', contacto: 'Don Hernán Vidal', telefono: '+56911000013' },
  tornillo: { nombre: 'Ferretería El Tornillo', rubro: 'Ferretería', contacto: 'Marcela Ibarra', telefono: '+56911000014' },
  fuerzasur: { nombre: 'Gimnasio Fuerza Sur', rubro: 'Gimnasio', contacto: 'Cristóbal Mella', telefono: '+56911000015' },
  cafe: { nombre: 'Café Puerto Sur', rubro: 'Cafetería', contacto: 'Rocío Medina', telefono: '+56981110001' },
  radio: { nombre: 'Radio Bío Sonora', rubro: 'Radio', contacto: 'Hugo Saavedra', telefono: '+56981110002' },
  rayo: { nombre: 'Energética Rayo Azul', rubro: 'Bebidas energéticas', contacto: 'Jonathan Cárdenas', telefono: '+56911000016', ...noConfiable('Incumplió el pago comprometido en 2 eventos y no respondió los llamados.') },
  cripto: { nombre: 'Cripto Fácil Chile', rubro: 'Criptomonedas', contacto: 'Ignacio Bravo', telefono: '+56911000017', ...noConfiable('Ofreció aportes muy altos sin contrato y desapareció antes del evento.') },
  veloz: { nombre: 'Zapatillas Veloz', rubro: 'Calzado deportivo', contacto: 'Karen Olivares', telefono: '+56911000018', ...noConfiable('Entregó el canje con 3 semanas de atraso.') },
  tiopepe: { nombre: 'Súper Jugos Tío Pepe', rubro: 'Jugos naturales', contacto: 'José Pérez', telefono: '+56911000019', ...noConfiable('Pidió rebajas después del evento y finalmente no pagó el aporte comprometido.') },
  golseguro: { nombre: 'Apuestas Gol Seguro', rubro: 'Apuestas deportivas', contacto: 'Matías Quiroz', telefono: '+56911000020', ...noConfiable('Negocio sin permisos claros; el aporte quedó sin pagar y se canceló el acuerdo.') },
  rapidas: { nombre: 'Inversiones Rápidas Ltda.', rubro: 'Préstamos', contacto: 'Mauricio Leiva', telefono: '+56981110003', ...noConfiable('Prometió un aporte en dinero y no pagó en la fecha comprometida.') },
};

// ---- Kits (cada uno con cámara, trípode, micrófono y switch: el mínimo del sistema) ----
// k1-k3: los de uso diario · k4-k6: los que usan los casos de prueba
export const KITS = {
  k1: { nombre: 'Kit Móvil 01 - Cancha Principal', nivel: 'BASICO', recargo_pct: 0, estado: 'DISPONIBLE' },
  k2: { nombre: 'Kit Multicámara 02 - Gimnasio', nivel: 'ESTANDAR', recargo_pct: 15, estado: 'DISPONIBLE' },
  k3: { nombre: 'Kit Alta Gama 03 - Estadio', nivel: 'ALTA_GAMA', recargo_pct: 25, estado: 'DISPONIBLE' },
  k4: { nombre: 'Kit Estudio Móvil 04', nivel: 'ESTANDAR', recargo_pct: 10, estado: 'DISPONIBLE' },
  k5: { nombre: 'Kit Terreno 05', nivel: 'BASICO', recargo_pct: 0, estado: 'EN_TERRENO' }, // salió en el caso C10 y no ha vuelto
  k6: { nombre: 'Kit Compacto 06', nivel: 'ALTA_GAMA', recargo_pct: 25, estado: 'INCOMPLETO' }, // perdió su cámara en el caso C14
};

const eq = (codigo, nombre, categoria, marca, modelo, valor_compra, kit, extra = {}) => ({ codigo, nombre, categoria, marca, modelo, valor_compra, kit, ...extra });
export const EQUIPOS = [
  eq('CAM-001', 'Cámara Sony FX3', 'CAMARA', 'Sony', 'FX3', 3500000, 'k1'),
  eq('TRI-001', 'Trípode Manfrotto Pro', 'TRIPODE', 'Manfrotto', '055', 350000, 'k1'),
  eq('MIC-001', 'Micrófono Rode Wireless GO II', 'MICROFONO', 'Rode', 'Wireless GO II', 280000, 'k1'),
  eq('SWI-001', 'Switch Blackmagic ATEM Mini', 'SWITCH_VIDEO', 'Blackmagic', 'ATEM Mini', 450000, 'k1'),

  eq('CAM-002', 'Cámara Blackmagic Pocket 6K', 'CAMARA', 'Blackmagic', 'Pocket 6K', 2100000, 'k2'),
  eq('TRI-002', 'Trípode Benro A373F', 'TRIPODE', 'Benro', 'A373F', 220000, 'k2'),
  eq('MIC-002', 'Micrófono Corbatero Sennheiser', 'MICROFONO', 'Sennheiser', 'EW-DP', 320000, 'k2'),
  eq('SWI-002', 'Switch ATEM Mini Pro', 'SWITCH_VIDEO', 'Blackmagic', 'ATEM Mini Pro', 650000, 'k2'),

  eq('CAM-003', 'Cámara Canon R6 Mark II', 'CAMARA', 'Canon', 'R6 Mark II', 2400000, 'k3'),
  eq('TRI-003', 'Trípode Sachtler Flowtech', 'TRIPODE', 'Sachtler', 'Flowtech 75', 520000, 'k3'),
  eq('MIC-003', 'Micrófono Shure MV88+', 'MICROFONO', 'Shure', 'MV88+', 250000, 'k3'),
  eq('SWI-003', 'Switch Roland V-1HD', 'SWITCH_VIDEO', 'Roland', 'V-1HD', 900000, 'k3'),

  eq('CAM-004', 'Cámara Panasonic HC-X2', 'CAMARA', 'Panasonic', 'HC-X2', 1900000, 'k4'),
  eq('TRI-004', 'Trípode Sachtler Ace M', 'TRIPODE', 'Sachtler', 'Ace M', 420000, 'k4'),
  eq('MIC-004', 'Micrófono Sennheiser MKE 600', 'MICROFONO', 'Sennheiser', 'MKE 600', 290000, 'k4'),
  eq('SWI-004', 'Switch ATEM Mini Pro ISO', 'SWITCH_VIDEO', 'Blackmagic', 'Mini Pro ISO', 780000, 'k4'),

  eq('CAM-005', 'Cámara Sony PXW-Z90', 'CAMARA', 'Sony', 'PXW-Z90', 2300000, 'k5'),
  eq('TRI-005', 'Trípode Manfrotto 502', 'TRIPODE', 'Manfrotto', '502', 310000, 'k5'),
  eq('MIC-005', 'Micrófono Rode NTG4+', 'MICROFONO', 'Rode', 'NTG4+', 260000, 'k5'),
  eq('SWI-005', 'Switch Roland V-02HD', 'SWITCH_VIDEO', 'Roland', 'V-02HD', 520000, 'k5'),

  eq('CAM-006', 'Cámara Canon XA60', 'CAMARA', 'Canon', 'XA60', 1200000, 'k6', { estado: 'DADO_DE_BAJA', motivo_baja: 'Perdida en el evento C14 · Cerrado con pérdida' }),
  eq('TRI-006', 'Trípode Benro S8 Pro', 'TRIPODE', 'Benro', 'S8 Pro', 380000, 'k6'),
  eq('MIC-006', 'Micrófono Shure VP83F', 'MICROFONO', 'Shure', 'VP83F', 330000, 'k6'),
  eq('SWI-006', 'Switch ATEM Mini Extreme', 'SWITCH_VIDEO', 'Blackmagic', 'Mini Extreme', 1100000, 'k6'),

  // Repuestos sueltos en bodega (sirven para completar el Kit Compacto 06)
  eq('REP-CAM-01', 'Cámara repuesto Sony ZV-E10', 'CAMARA', 'Sony', 'ZV-E10', 750000, null),
  eq('REP-MIC-01', 'Micrófono repuesto corbatero', 'MICROFONO', 'Sony', 'ECM-W2BT', 190000, null),
];

export default async function sembrarCatalogo(ctx) {
  ctx.rol = {};
  for (const [k, r] of Object.entries(ROLES)) {
    ctx.rol[k] = await prisma.rolTrabajo.create({ data: { nombre: r.nombre, porcentaje_referencial: r.pct, id_dueno: ctx.dueno.id_dueno } });
  }

  ctx.trab = {};
  for (const [k, t] of Object.entries(TRABAJADORES)) {
    ctx.trab[k] = await prisma.trabajador.create({
      data: {
        nombre: t.nombre, telefono_whatsapp: t.telefono_whatsapp, correo: t.correo ?? null,
        estado: t.estado ?? 'ACTIVO', id_dueno: ctx.dueno.id_dueno,
        roles: { create: t.roles.map((r) => ({ id_rol: ctx.rol[r].id_rol })) },
      },
    });
    for (const [i, [desde, hasta]] of t.disp.entries()) {
      await prisma.disponibilidad.create({
        data: {
          id_trabajador: ctx.trab[k].id_trabajador, nro_bloque: i + 1,
          fecha_inicio: fechaDB(dia(desde)), fecha_termino: fechaDB(dia(hasta)), id_dueno: ctx.dueno.id_dueno,
        },
      });
    }
  }

  ctx.cli = {};
  for (const [k, c] of Object.entries(CLIENTES)) {
    ctx.cli[k] = await prisma.cliente.create({ data: { ...c, id_dueno: ctx.dueno.id_dueno } });
  }

  ctx.ausp = {};
  for (const [k, a] of Object.entries(AUSPICIADORES)) {
    ctx.ausp[k] = await prisma.auspiciador.create({ data: { clasificacion: 'CONFIABLE', ...a, id_dueno: ctx.dueno.id_dueno } });
  }

  ctx.kit = {};
  for (const [k, kit] of Object.entries(KITS)) {
    ctx.kit[k] = await prisma.kit.create({ data: { ...kit, id_jefe: ctx.jefe.id_jefe } });
  }
  for (const e of EQUIPOS) {
    await prisma.equipo.create({
      data: {
        codigo: e.codigo, nombre: e.nombre, categoria: e.categoria, marca: e.marca, modelo: e.modelo,
        valor_compra: e.valor_compra, fecha_compra: fechaDB(dia(-300)),
        estado: e.estado ?? 'OPERATIVO', motivo_baja: e.motivo_baja ?? null,
        fecha_baja: e.estado === 'DADO_DE_BAJA' ? fechaDB(dia(-8)) : null,
        id_kit: e.kit ? ctx.kit[e.kit].id_kit : null, id_jefe: ctx.jefe.id_jefe,
      },
    });
  }
  ctx.equipos = EQUIPOS;

  console.log(
    `\nCatálogo: ${Object.keys(ROLES).length} roles · ${Object.keys(TRABAJADORES).length} trabajadores · ${Object.keys(CLIENTES).length} clientes · ` +
      `${Object.keys(AUSPICIADORES).length} auspiciadores · ${Object.keys(KITS).length} kits · ${EQUIPOS.length} equipos`,
  );
}
