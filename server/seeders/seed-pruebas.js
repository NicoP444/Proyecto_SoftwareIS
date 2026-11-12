// Datos de prueba (clientes y eventos). NO lo usa nada del sistema: se puede borrar la carpeta /seeders cuando quieras.
//   Crear datos:   npm run seed:pruebas
//   Borrar datos:  npm run seed:limpiar
import 'dotenv/config';
import prisma from '../src/config/prisma.js';

const ID_DUENO = 1;
const MARCA = '[SEED]'; // los eventos de prueba llevan esta marca en "observaciones" para poder borrarlos después

// RUT válidos (con dígito verificador) y sin puntos ni guion, como los guarda el sistema
const CLIENTES = [
  { rut: '111111111', nombre: 'Club Deportivo Los Andes', telefono: '+56911111111', correo: 'andes@test.cl' },
  { rut: '123456785', nombre: 'Municipalidad de Prueba', telefono: '+56922222222', correo: 'muni@test.cl' },
  { rut: '152345674', nombre: 'Colegio San Martín', telefono: '+56933333333' },
  { rut: '178901230', nombre: 'Productora Sur Eventos', telefono: '+56944444444', correo: 'sur@test.cl' },
  { rut: '187654327', nombre: 'Liga Universitaria', telefono: '+56955555555' },
];

// dia = días desde hoy (negativo = pasado), horas "HH:MM"
const EVENTOS = [
  { cliente: 0, tipo: 'Partido de fútbol',     dia: -3, ini: '15:00', fin: '18:00', cam: 3, precio: 220000, dir: 'Estadio Municipal, Concepción' },
  { cliente: 1, tipo: 'Aniversario comunal',   dia: -1, ini: '19:00', fin: '23:00', cam: 2, precio: 300000, dir: 'Plaza Perú, Concepción' },
  { cliente: 2, tipo: 'Acto de graduación',    dia: 1,  ini: '10:00', fin: '13:00', cam: 2, precio: 180000, dir: 'Gimnasio Colegio San Martín' },
  { cliente: 3, tipo: 'Matrimonio',            dia: 2,  ini: '15:00', fin: '21:00', cam: 3, precio: 450000, dir: 'Centro de Eventos, Hualpén' },
  { cliente: 4, tipo: 'Torneo de básquetbol',  dia: 3,  ini: '09:00', fin: '15:00', cam: 4, precio: 520000, dir: 'Gimnasio Universitario' },
  { cliente: 0, tipo: 'Partido de fútbol',     dia: 5,  ini: '16:00', fin: '18:30', cam: 3, precio: 200000, dir: 'Estadio Municipal, Concepción' },
  { cliente: 1, tipo: 'Concierto',             dia: 7,  ini: '20:00', fin: '01:00', cam: 4, precio: 600000, dir: 'Parque Ecuador, Concepción' },
  { cliente: 2, tipo: 'Charla tech',           dia: 8,  ini: '10:00', fin: '12:00', cam: 1, precio: 90000,  dir: 'Auditorio Central' },
  { cliente: 3, tipo: 'Cumpleaños',            dia: 10, ini: '18:00', fin: '21:00', cam: 1, precio: 150000, dir: 'Av. Collao 1202, Concepción' },
  { cliente: 4, tipo: 'Final de campeonato',   dia: 14, ini: '14:00', fin: '20:00', cam: 5, precio: 700000, dir: 'Complejo Deportivo Sur' },
];

const fechaDesdeHoy = (dias) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
};

// Borra solo lo creado por este seeder
export async function limpiar() {
  const eventos = await prisma.evento.findMany({
    where: { observaciones: { startsWith: MARCA } },
    select: { id_evento: true },
  });
  const ids = eventos.map((e) => e.id_evento);

  if (ids.length > 0) {
    await prisma.asignacionPersonal.deleteMany({ where: { id_evento: { in: ids } } });
    await prisma.reservaKit.deleteMany({ where: { id_evento: { in: ids } } });
    await prisma.historialCambio.updateMany({ where: { id_evento: { in: ids } }, data: { id_evento: null } });
    await prisma.evento.deleteMany({ where: { id_evento: { in: ids } } });
  }

  let clientesBorrados = 0;
  for (const c of CLIENTES) {
    const cliente = await prisma.cliente.findUnique({ where: { rut: c.rut } });
    if (!cliente) continue;
    const quedan = await prisma.evento.count({ where: { id_cliente: cliente.id_cliente } });
    if (quedan > 0) continue; // tiene eventos reales: no se toca
    await prisma.cliente.delete({ where: { id_cliente: cliente.id_cliente } });
    clientesBorrados++;
  }
  console.log(`Limpieza lista: ${ids.length} evento(s) y ${clientesBorrados} cliente(s) eliminados`);
}

async function crear() {
  const dueno = await prisma.dueno.findUnique({ where: { id_dueno: ID_DUENO } });
  if (!dueno) throw new Error('No existe el dueño 1. Ejecuta primero: node prisma/seed.js');

  await limpiar(); // así se puede correr varias veces sin duplicar

  const clientes = [];
  for (const c of CLIENTES) {
    clientes.push(await prisma.cliente.create({ data: { ...c, id_dueno: ID_DUENO } }));
  }

  for (const e of EVENTOS) {
    const fecha = fechaDesdeHoy(e.dia);
    const inicio = new Date(`${fecha}T${e.ini}:00Z`);
    let termino = new Date(`${fecha}T${e.fin}:00Z`);
    if (termino <= inicio) termino = new Date(termino.getTime() + 24 * 60 * 60 * 1000); // termina pasada la medianoche

    const horas = (termino - inicio) / (1000 * 60 * 60);
    await prisma.evento.create({
      data: {
        tipo: e.tipo,
        fecha: new Date(fecha),
        hora_inicio: inicio,
        hora_termino: termino,
        direccion: e.dir,
        cantidad_camaras: e.cam,
        precio_acordado: e.precio,
        observaciones: `${MARCA} dato de prueba`,
        estado: horas >= 5 ? 'PENDIENTE_ADELANTO' : 'CONFIRMADO', // misma regla del sistema
        id_cliente: clientes[e.cliente].id_cliente,
        id_dueno: ID_DUENO,
      },
    });
  }
  console.log(`Listo: ${clientes.length} clientes y ${EVENTOS.length} eventos de prueba creados`);
}

const accion = process.argv[2] === 'limpiar' ? limpiar : crear;
accion()
  .catch((e) => { console.error('Error en el seeder:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());