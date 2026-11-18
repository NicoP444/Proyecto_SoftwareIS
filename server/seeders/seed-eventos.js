// Eventos de prueba con fechas fijas: fines de noviembre y todo diciembre (para la presentación).
// Solo crea eventos: los clientes los crea seed-clientes.js (hay que correrlo antes).
//   Crear:  npm run seed:eventos
//   Borrar: npm run seed:limpiar
// Se puede correr varias veces: si el evento ya existe, no lo duplica.
import 'dotenv/config';
import prisma from '../src/config/prisma.js';

const MARCA = '[SEED-EV]'; // para que seed:limpiar y seed:kits encuentren estos eventos

// El cliente se indica por RUT (los mismos de seed-clientes.js)
// fecha "YYYY-MM-DD", horas "HH:MM". Un evento por día para que no se pisen.
const EVENTOS = [
  // --- Fines de noviembre ---
  { rut: '111111111', tipo: 'Partido de fútbol',                fecha: '2026-11-21', ini: '16:00', fin: '18:30', cam: 3, precio: 220000, dir: 'Estadio Municipal, Concepción' },
  { rut: '187654327', tipo: 'Copa universitaria de básquetbol', fecha: '2026-11-24', ini: '17:00', fin: '20:00', cam: 3, precio: 190000, dir: 'Gimnasio Universitario, Concepción' },
  { rut: '123456785', tipo: 'Charla tech en streaming',         fecha: '2026-11-27', ini: '10:00', fin: '13:00', cam: 2, precio: 150000, dir: 'Auditorio Central, Concepción' },
  { rut: '178901230', tipo: 'Matrimonio',                       fecha: '2026-11-28', ini: '15:00', fin: '22:00', cam: 3, precio: 450000, dir: 'Centro de Eventos, Hualpén' },

  // --- Diciembre ---
  { rut: '152345674', tipo: 'Acto de graduación',               fecha: '2026-12-03', ini: '10:00', fin: '13:00', cam: 2, precio: 180000, dir: 'Gimnasio Colegio San Martín, Concepción' },
  { rut: '187654327', tipo: 'Final de campeonato',              fecha: '2026-12-05', ini: '14:00', fin: '20:00', cam: 5, precio: 700000, dir: 'Complejo Deportivo Sur, Coronel' },
  { rut: '178901230', tipo: 'Matrimonio',                       fecha: '2026-12-06', ini: '16:00', fin: '23:00', cam: 3, precio: 480000, dir: 'Viña Santa Cruz, Chiguayante' },
  { rut: '123456785', tipo: 'Concierto de Navidad',             fecha: '2026-12-12', ini: '19:00', fin: '22:30', cam: 4, precio: 600000, dir: 'Plaza Independencia, Concepción' },
  { rut: '111111111', tipo: 'Campeonato de fútbol amateur',     fecha: '2026-12-13', ini: '09:00', fin: '15:00', cam: 3, precio: 350000, dir: 'Estadio Municipal, Concepción' },
  { rut: '152345674', tipo: 'Ceremonia de licenciatura',        fecha: '2026-12-18', ini: '11:00', fin: '14:00', cam: 2, precio: 200000, dir: 'Teatro Biobío, Concepción' },
  { rut: '178901230', tipo: 'Fiesta de fin de año',             fecha: '2026-12-19', ini: '20:00', fin: '23:30', cam: 2, precio: 320000, dir: 'Centro de Eventos, Hualpén' },
  { rut: '123456785', tipo: 'Cena de gala municipal',           fecha: '2026-12-22', ini: '19:30', fin: '23:00', cam: 2, precio: 280000, dir: 'Salón de Honor Municipalidad, Concepción' },
  { rut: '111111111', tipo: 'Partido de exhibición',            fecha: '2026-12-27', ini: '17:00', fin: '19:30', cam: 3, precio: 240000, dir: 'Estadio Ester Roa, Concepción' },
  { rut: '178901230', tipo: 'Celebración de Año Nuevo',         fecha: '2026-12-31', ini: '21:00', fin: '23:45', cam: 3, precio: 400000, dir: 'Parque Ecuador, Concepción' },
];

async function main() {
  const dueno = await prisma.dueno.findFirst();
  if (!dueno) throw new Error('No existe ningún dueño. Ejecuta primero: npm run seed:base');

  // Los clientes tienen que existir (los crea seed-clientes.js)
  const ruts = [...new Set(EVENTOS.map((e) => e.rut))];
  const clientes = await prisma.cliente.findMany({ where: { rut: { in: ruts } } });
  const porRut = Object.fromEntries(clientes.map((c) => [c.rut, c]));
  const faltan = ruts.filter((r) => !porRut[r]);
  if (faltan.length > 0) {
    throw new Error(`Faltan clientes (${faltan.join(', ')}). Ejecuta primero: npm run seed:clientes`);
  }

  let creados = 0;
  for (const e of EVENTOS) {
    const cliente = porRut[e.rut];
    const fecha = new Date(e.fecha);

    const existe = await prisma.evento.findFirst({
      where: { tipo: e.tipo, fecha, id_cliente: cliente.id_cliente, observaciones: { startsWith: MARCA } },
    });
    if (existe) continue;

    const inicio = new Date(`${e.fecha}T${e.ini}:00Z`);
    const termino = new Date(`${e.fecha}T${e.fin}:00Z`);
    const horas = (termino - inicio) / (1000 * 60 * 60);

    const ev = await prisma.evento.create({
      data: {
        tipo: e.tipo,
        fecha,
        hora_inicio: inicio,
        hora_termino: termino,
        direccion: e.dir,
        precio_acordado: e.precio,
        observaciones: `${MARCA} dato de prueba`,
        estado: horas >= 5 ? 'PENDIENTE_ADELANTO' : 'CONFIRMADO', // misma regla del sistema
        id_cliente: cliente.id_cliente,
        id_dueno: dueno.id_dueno,
      },
    });
    creados++;
    console.log(`Evento creado: ID ${ev.id_evento} - ${ev.tipo} (${e.fecha})`);
  }
  console.log(`Listo: ${creados} evento(s) nuevos (${EVENTOS.length - creados} ya existían)`);
}

main()
  .catch((e) => { console.error('Error al insertar eventos:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());