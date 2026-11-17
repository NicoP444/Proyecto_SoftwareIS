// Limpia lo que crean los seeders de datos (clientes, eventos, auspiciadores, kits, equipos, trabajadores y roles).
//   Borrar todo:  npm run seed:limpiar
// Los usuarios (dueño, contador, jefe técnico) NO se borran, para no perder sesiones ni tokens.
// Si algo sembrado quedó usado por datos reales, se conserva y se avisa.
// OJO: si agregas datos nuevos a un seeder, agrégalos también a las listas de abajo.
import 'dotenv/config';
import prisma from '../src/config/prisma.js';

// ---- Lo que crea cada seeder ----
const MARCA = '[SEED'; // seed-eventos marca sus eventos con [SEED-EV] (los seeders viejos usaban [SEED] y [SEED-KIT])

// Nombres de eventos de versiones anteriores de los seeders (quedan en bases viejas)
const TIPOS_EVENTO = [
  'TRANSMISION_LIGA_REGIONAL', 'COPA_UNIVERSITARIA_OCT', 'STREAMING_CHARLA_TECH', 'ENCUENTRO_DEPORTIVO_SUR',
  'TRANSMISION_FUTBOL', 'STREAMING_CONGRESO', 'FESTIVAL_MUSICA_SUR',
  'Transmisión de fútbol', 'Streaming de congreso', 'Festival de música del sur',
];

const RUT_CLIENTES = [
  '111111111', '123456785', '152345674', '178901230', '187654327', // seed-clientes.js
  '112223339', '201112222', '154321985',                           // clientes de versiones anteriores
];

const NOMBRES_KITS = ['Kit Móvil 01 - Cancha Principal', 'Kit Multicámara 02 - Gimnasio', 'Kit Compacto 03 - Entrevistas'];
const CODIGOS_EQUIPOS = ['CAM-001', 'TRI-001', 'MIC-001', 'CAM-002', 'TRI-002', 'MIC-002', 'CAM-003', 'TRI-003', 'MIC-003'];

const NOMBRES_AUSPICIADORES = [
  'Coca-Cola', 'Pepsi', 'Gatorade', 'Powerade', 'Red Bull', 'Monster Energy',
  'Adidas', 'Nike', 'Netflix', 'Spotify', 'Entel', 'BancoEstado',
  'Panadería La Espiga', 'Ferretería El Tornillo', 'Gimnasio Fuerza Sur',
  'Energética Rayo Azul', 'Cripto Fácil Chile', 'Zapatillas Veloz', 'Súper Jugos Tío Pepe', 'Apuestas Gol Seguro',
]; // seed-auspiciadores.js

// Si algo no se puede borrar porque hay datos reales que dependen de él (error de llave foránea), se salta y se avisa
async function intentar(descripcion, fn) {
  try {
    return await fn();
  } catch (e) {
    const msg = String(e.message || '');
    const esLlaveForanea =
      e.code === 'P2003' || e.code === 'P2014' ||
      msg.includes('23001') || msg.includes('23503') ||
      msg.includes('foreign key') || msg.includes('violates RESTRICT');
    if (esLlaveForanea) {
      console.log(`  - Se conserva ${descripcion}: tiene datos asociados que no son de seeders`);
      return null;
    }
    throw e;
  }
}

// Borra eventos y todo lo que cuelga de ellos (incluidos los acuerdos de auspicio). En transacción: o se borra todo o nada.
async function borrarEventos(ids) {
  if (ids.length === 0) return 0;
  const deEvento = { id_evento: { in: ids } };
  await prisma.$transaction([
    prisma.pagoCliente.deleteMany({ where: deEvento }),
    prisma.gastoEvento.deleteMany({ where: { asignacion: deEvento } }),
    prisma.pagoRemuneracion.deleteMany({ where: { asignacion: deEvento } }),
    prisma.salidaKit.deleteMany({ where: { reserva: deEvento } }),
    prisma.acuerdoAuspicio.deleteMany({ where: deEvento }),
    prisma.incidente.deleteMany({ where: deEvento }),
    prisma.asignacionPersonal.deleteMany({ where: deEvento }),
    prisma.reservaKit.deleteMany({ where: deEvento }),
    prisma.historialCambio.updateMany({ where: deEvento, data: { id_evento: null } }),
    prisma.evento.deleteMany({ where: deEvento }),
  ]);
  return ids.length;
}

async function limpiarEventos() {
  const eventos = await prisma.evento.findMany({
    where: {
      OR: [
        { observaciones: { startsWith: MARCA } },
        { tipo: { in: TIPOS_EVENTO } },
        { cliente: { rut: { in: RUT_CLIENTES } } }, // cualquier evento de los clientes de seed
      ],
    },
    select: { id_evento: true },
  });
  return borrarEventos(eventos.map((e) => e.id_evento));
}

async function limpiarClientes() {
  let borrados = 0;
  for (const rut of RUT_CLIENTES) {
    const cliente = await prisma.cliente.findUnique({ where: { rut } });
    if (!cliente) continue;
    const quedan = await prisma.evento.count({ where: { id_cliente: cliente.id_cliente } });
    if (quedan > 0) {
      console.log(`  - Se conserva el cliente ${rut}: tiene eventos reales`);
      continue;
    }
    await prisma.cliente.delete({ where: { id_cliente: cliente.id_cliente } });
    borrados++;
  }
  return borrados;
}

async function limpiarAuspiciadores() {
  const auspiciadores = await prisma.auspiciador.findMany({
    where: { nombre: { in: NOMBRES_AUSPICIADORES } },
    select: { id_auspiciador: true },
  });
  const ids = auspiciadores.map((a) => a.id_auspiciador);
  if (ids.length === 0) return 0;

  // Primero los acuerdos de esos auspiciadores (y sus aportes recibidos), después los auspiciadores
  const deAuspiciador = { id_auspiciador: { in: ids } };
  await prisma.$transaction([
    prisma.cumplimientoAporte.deleteMany({ where: { acuerdo: deAuspiciador } }),
    prisma.acuerdoAuspicio.deleteMany({ where: deAuspiciador }),
    prisma.auspiciador.deleteMany({ where: deAuspiciador }),
  ]);
  return ids.length;
}

async function limpiarKitsYEquipos() {
  // Reservas (y sus salidas) de los kits de seed, por si quedaron en eventos que no eran de seed
  const kits = await prisma.kit.findMany({ where: { nombre: { in: NOMBRES_KITS } }, select: { id_kit: true } });
  const idsKit = kits.map((k) => k.id_kit);
  const deKit = { id_kit: { in: idsKit } };

  await prisma.$transaction([
    prisma.salidaKit.deleteMany({ where: { reserva: deKit } }),
    prisma.reservaKit.deleteMany({ where: deKit }),
    prisma.revisa.deleteMany({ where: { codigo: { in: CODIGOS_EQUIPOS } } }),
    prisma.incidente.deleteMany({ where: { codigo: { in: CODIGOS_EQUIPOS } } }),
    prisma.equipo.deleteMany({ where: { codigo: { in: CODIGOS_EQUIPOS } } }),
    prisma.kit.deleteMany({ where: { nombre: { in: NOMBRES_KITS } } }),
  ]);
  return { kits: idsKit.length };
}

// Borra TODOS los trabajadores y roles, sin importar el nombre
async function limpiarPersonal() {
  const trabajadores = await prisma.trabajador.findMany({ select: { id_trabajador: true } });
  const idsTrab = trabajadores.map((t) => t.id_trabajador);
  const asignaciones = await prisma.asignacionPersonal.findMany({
    where: { id_trabajador: { in: idsTrab } },
    select: { id_asignacion: true },
  });
  const deAsig = { id_asignacion: { in: asignaciones.map((a) => a.id_asignacion) } };

  await prisma.$transaction([
    prisma.gastoEvento.deleteMany({ where: deAsig }),
    prisma.pagoRemuneracion.deleteMany({ where: deAsig }),
    prisma.salidaKit.deleteMany({ where: deAsig }),
    prisma.asignacionPersonal.deleteMany({ where: deAsig }),
    prisma.incidente.updateMany({ where: { id_trabajador: { in: idsTrab } }, data: { id_trabajador: null } }),
    prisma.trabajador.deleteMany({ where: { id_trabajador: { in: idsTrab } } }),
  ]);

  const roles = await intentar('los roles de trabajo', () => prisma.rolTrabajo.deleteMany({}));
  return { trabajadores: idsTrab.length, roles: roles?.count ?? 0 };
}

export async function limpiarTodo() {
  const eventos = await limpiarEventos();
  const auspiciadores = await limpiarAuspiciadores();
  const clientes = await limpiarClientes();
  const { kits } = await limpiarKitsYEquipos();
  const { trabajadores, roles } = await limpiarPersonal();

  console.log('Limpieza lista (los usuarios no se tocan):');
  console.log(`  eventos: ${eventos} | auspiciadores: ${auspiciadores} | clientes: ${clientes} | kits: ${kits} | equipos: hasta ${CODIGOS_EQUIPOS.length}`);
  console.log(`  trabajadores: ${trabajadores} | roles: ${roles}`);
}

limpiarTodo()
  .catch((e) => { console.error('Error al limpiar:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());