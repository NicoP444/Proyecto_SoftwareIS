// Kits, equipos, roles y trabajadores de prueba. NO crea clientes ni eventos:
// las reservas y asignaciones se hacen sobre los eventos de seed-eventos.js (hay que correrlo antes).
//   Crear:  npm run seed:kits
//   Borrar: npm run seed:limpiar
import 'dotenv/config';
import prisma from '../src/config/prisma.js';

const MARCA_EVENTOS = '[SEED-EV]'; // la marca que pone seed-eventos.js

const ROLES = ['Camarógrafo Principal', 'Operador de Sonido', 'Asistente de Transmisión'];

const TRABAJADORES = [
  { nombre: 'Carlos Carrasco', telefono_whatsapp: '+56912345678' },
  { nombre: 'Sebastián Morales', telefono_whatsapp: '+56987654321' },
  { nombre: 'Valentina Henríquez', telefono_whatsapp: '+56955443322' },
];

const KITS = [
  { nombre: 'Kit Móvil 01 - Cancha Principal', nivel: 'BASICO' },
  { nombre: 'Kit Multicámara 02 - Gimnasio', nivel: 'BASICO' },
  { nombre: 'Kit Compacto 03 - Entrevistas', nivel: 'BASICO' },
];

// kit = posición en KITS
const EQUIPOS = [
  { codigo: 'CAM-001', nombre: 'Cámara Sony FX3', categoria: 'CAMARA', valor_compra: 3500000, kit: 0 },
  { codigo: 'TRI-001', nombre: 'Trípode Manfrotto Pro', categoria: 'TRIPODE', valor_compra: 350000, kit: 0 },
  { codigo: 'MIC-001', nombre: 'Micrófono Rode Wireless GO II', categoria: 'MICROFONO', valor_compra: 280000, kit: 0 },

  { codigo: 'CAM-002', nombre: 'Cámara Blackmagic 4K', categoria: 'CAMARA', valor_compra: 1800000, kit: 1 },
  { codigo: 'TRI-002', nombre: 'Trípode Benro', categoria: 'TRIPODE', valor_compra: 220000, kit: 1 },
  { codigo: 'MIC-002', nombre: 'Micrófono Corbatero Sennheiser', categoria: 'MICROFONO', valor_compra: 320000, kit: 1 },

  { codigo: 'CAM-003', nombre: 'Cámara Canon R6 Mark II', categoria: 'CAMARA', valor_compra: 2400000, kit: 2 },
  { codigo: 'TRI-003', nombre: 'Trípode Compacto K&F', categoria: 'TRIPODE', valor_compra: 120000, kit: 2 },
  { codigo: 'MIC-003', nombre: 'Micrófono Shure MV88+', categoria: 'MICROFONO', valor_compra: 250000, kit: 2 },

  // Un switch por kit: sin él, el kit no cumple el mínimo (cámara, trípode, micrófono y switch)
  { codigo: 'SWI-001', nombre: 'Switch Blackmagic ATEM Mini', categoria: 'SWITCH_VIDEO', valor_compra: 450000, kit: 0 },
  { codigo: 'SWI-002', nombre: 'Switch Blackmagic ATEM Mini Pro', categoria: 'SWITCH_VIDEO', valor_compra: 650000, kit: 1 },
  { codigo: 'SWI-003', nombre: 'Switch Roland V-1HD', categoria: 'SWITCH_VIDEO', valor_compra: 900000, kit: 2 },
];

async function main() {
  const dueno = await prisma.dueno.findFirst();
  if (!dueno) throw new Error('No existe ningún dueño. Ejecuta primero: npm run seed:base');

  const jefe = await prisma.jefeAreaTecnica.findFirst();
  if (!jefe) throw new Error('No existe ningún jefe técnico. Ejecuta primero: npm run seed:usuarios');

  // 1. Roles de trabajo
  const roles = [];
  for (const nombre of ROLES) {
    let rol = await prisma.rolTrabajo.findFirst({ where: { nombre } });
    if (!rol) rol = await prisma.rolTrabajo.create({ data: { nombre, id_dueno: dueno.id_dueno } });
    roles.push(rol);
  }

  // 2. Trabajadores
  const trabajadores = [];
  for (const t of TRABAJADORES) {
    let trab = await prisma.trabajador.findFirst({ where: { nombre: t.nombre } });
    if (!trab) trab = await prisma.trabajador.create({ data: { ...t, id_dueno: dueno.id_dueno } });
    trabajadores.push(trab);
  }

  // 3. Kits (siempre quedan DISPONIBLE)
  const kits = [];
  for (const k of KITS) {
    let kit = await prisma.kit.findFirst({ where: { nombre: k.nombre } });
    if (!kit) {
      kit = await prisma.kit.create({
        data: { nombre: k.nombre, nivel: k.nivel, id_jefe: jefe.id_jefe, estado: 'DISPONIBLE' },
      });
    } else {
      await prisma.kit.update({ where: { id_kit: kit.id_kit }, data: { estado: 'DISPONIBLE' } });
    }
    kits.push(kit);
  }

  // 4. Equipos de cada kit
  for (const eq of EQUIPOS) {
    const id_kit = kits[eq.kit].id_kit;
    const existente = await prisma.equipo.findUnique({ where: { codigo: eq.codigo } });
    if (!existente) {
      await prisma.equipo.create({
        data: {
          codigo: eq.codigo,
          nombre: eq.nombre,
          categoria: eq.categoria,
          valor_compra: eq.valor_compra,
          id_kit,
          id_jefe: jefe.id_jefe,
          estado: 'OPERATIVO',
          fecha_compra: new Date(),
        },
      });
    } else {
      await prisma.equipo.update({ where: { codigo: eq.codigo }, data: { id_kit, estado: 'OPERATIVO' } });
    }
  }

  // 5. Reservas y personal sobre los eventos de seed más próximos (uno por kit)
  const hoy = new Date();
  hoy.setUTCHours(0, 0, 0, 0);
  const eventos = await prisma.evento.findMany({
    where: { observaciones: { startsWith: MARCA_EVENTOS }, fecha: { gte: hoy } },
    orderBy: [{ fecha: 'asc' }, { hora_inicio: 'asc' }],
    take: kits.length,
  });
  if (eventos.length === 0) {
    throw new Error('No hay eventos de seed próximos. Ejecuta primero: npm run seed:eventos');
  }

  for (let i = 0; i < eventos.length; i++) {
    const evento = eventos[i];

    // Asignar los trabajadores al evento
    for (let j = 0; j < trabajadores.length; j++) {
      const existeAsig = await prisma.asignacionPersonal.findFirst({
        where: { id_evento: evento.id_evento, id_trabajador: trabajadores[j].id_trabajador },
      });
      if (!existeAsig) {
        await prisma.asignacionPersonal.create({
          data: {
            id_evento: evento.id_evento,
            id_trabajador: trabajadores[j].id_trabajador,
            id_rol: roles[j % roles.length].id_rol,
            id_dueno: dueno.id_dueno,
          },
        });
      }
    }

    // Reservar el kit correspondiente
    const reserva = await prisma.reservaKit.findFirst({
      where: { id_evento: evento.id_evento, id_kit: kits[i].id_kit },
    });
    if (!reserva) {
      await prisma.reservaKit.create({
        data: { id_evento: evento.id_evento, id_kit: kits[i].id_kit, id_dueno: dueno.id_dueno },
      });
    } else {
      // Limpiar salidas anteriores para que queden listos para probar de nuevo
      await prisma.salidaKit.deleteMany({ where: { id_reserva: reserva.id_reserva } });
    }
  }

  console.log(`Listo: ${kits.length} kits, ${EQUIPOS.length} equipos, ${trabajadores.length} trabajadores y ${roles.length} roles.`);
  console.log(`Reservas y personal asignados a ${eventos.length} evento(s) de seed.`);
}

main()
  .catch((e) => {
    console.error('Error al generar datos:', e.message);
    process.exitCode = 1; // así "npm run seed:todo" se detiene si algo falla
  })
  .finally(() => prisma.$disconnect());