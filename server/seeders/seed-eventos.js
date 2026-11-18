// Eventos de prueba: fines de noviembre y diciembre (futuros) + 4 cerrados y 1 realizado de oct/nov (pasados).
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


// ---------- Eventos ya pasados: CERRADOS (y uno REALIZADO) para probar el cierre de jornada ----------
// Traen pagos del cliente, personal con porcentaje y remuneración y, si están cerrados, rentabilidad final.
// Usan los mismos roles y trabajadores de seed-kits.js (si no existen, se crean con esos nombres).
const ROLES_PRUEBA = ['Camarógrafo Principal', 'Operador de Sonido', 'Asistente de Transmisión'];
const TRABAJADORES_PRUEBA = [
  { nombre: 'Carlos Carrasco', telefono_whatsapp: '+56912345678' },
  { nombre: 'Sebastián Morales', telefono_whatsapp: '+56987654321' },
  { nombre: 'Valentina Henríquez', telefono_whatsapp: '+56955443322' },
];

// pagos: [tipo, monto, fecha]. personal: [posición en TRABAJADORES_PRUEBA, posición en ROLES_PRUEBA, porcentaje]
const EVENTOS_PASADOS = [
  { // Ganancia: pagado completo
    rut: '111111111', tipo: 'Partido de fútbol', fecha: '2026-10-10', ini: '15:00', fin: '17:30',
    precio: 250000, dir: 'Estadio Municipal, Concepción', estado: 'CERRADO',
    pagos: [['PAGO_TOTAL', 250000, '2026-10-08']],
    personal: [[0, 0, 20], [1, 1, 15], [2, 2, 10]],
  },
  { // Ganancia: adelanto + saldo (dura 7 h, partió como Pendiente de adelanto)
    rut: '178901230', tipo: 'Matrimonio', fecha: '2026-10-17', ini: '16:00', fin: '23:00',
    precio: 500000, dir: 'Centro de Eventos, Hualpén', estado: 'CERRADO',
    pagos: [['ADELANTO', 250000, '2026-10-01'], ['SALDO', 250000, '2026-10-18']],
    personal: [[0, 0, 18], [1, 1, 12], [2, 2, 10]],
  },
  { // Pérdida: el cliente solo pagó el adelanto y las remuneraciones son altas
    rut: '187654327', tipo: 'Copa universitaria de básquetbol', fecha: '2026-10-24', ini: '17:00', fin: '20:00',
    precio: 200000, dir: 'Gimnasio Universitario, Concepción', estado: 'CERRADO',
    pagos: [['ADELANTO', 100000, '2026-10-20']],
    personal: [[0, 0, 30], [1, 1, 25], [2, 2, 15]],
  },
  { // Ganancia: un solo trabajador
    rut: '152345674', tipo: 'Ceremonia de licenciatura', fecha: '2026-11-07', ini: '11:00', fin: '14:00',
    precio: 180000, dir: 'Teatro Biobío, Concepción', estado: 'CERRADO',
    pagos: [['PAGO_TOTAL', 180000, '2026-11-05']],
    personal: [[0, 0, 25]],
  },
  { // Realizado sin cerrar: no se puede eliminar y sirve para probar el cierre de jornada
    rut: '123456785', tipo: 'Charla tech en streaming', fecha: '2026-11-14', ini: '10:00', fin: '12:30',
    precio: 150000, dir: 'Auditorio Central, Concepción', estado: 'REALIZADO',
    pagos: [['PAGO_TOTAL', 150000, '2026-11-12']],
    personal: [[1, 0, 20], [2, 1, 15]],
  },
];

// porcentaje * precio, redondeado al peso (igual que RF-P7-07)
const remuneracionDe = (porcentaje, precio) => Math.round((porcentaje * precio) / 100);

async function crearEventosPasados(dueno) {
  const contador = await prisma.contador.findFirst();
  if (!contador) throw new Error('No existe ningún contador. Ejecuta primero: npm run seed:base');

  const clientes = await prisma.cliente.findMany({ where: { rut: { in: EVENTOS_PASADOS.map((e) => e.rut) } } });
  const porRut = Object.fromEntries(clientes.map((c) => [c.rut, c]));

  // Roles y trabajadores (los reutiliza seed-kits.js, que los busca por nombre)
  const roles = [];
  for (const nombre of ROLES_PRUEBA) {
    let rol = await prisma.rolTrabajo.findFirst({ where: { nombre } });
    if (!rol) rol = await prisma.rolTrabajo.create({ data: { nombre, id_dueno: dueno.id_dueno } });
    roles.push(rol);
  }
  const trabajadores = [];
  for (const t of TRABAJADORES_PRUEBA) {
    let trab = await prisma.trabajador.findFirst({ where: { nombre: t.nombre } });
    if (!trab) trab = await prisma.trabajador.create({ data: { ...t, id_dueno: dueno.id_dueno } });
    trabajadores.push(trab);
  }

  let creados = 0;
  for (const e of EVENTOS_PASADOS) {
    const cliente = porRut[e.rut];
    if (!cliente) {
      console.log(`  - Se omite "${e.tipo}": falta el cliente ${e.rut}`);
      continue;
    }
    const fecha = new Date(e.fecha);
    const existe = await prisma.evento.findFirst({
      where: { tipo: e.tipo, fecha, id_cliente: cliente.id_cliente, observaciones: { startsWith: MARCA } },
    });
    if (existe) continue;

    const cerrado = e.estado === 'CERRADO';
    const totalPagado = e.pagos.reduce((s, [, monto]) => s + monto, 0);
    const totalRemuneraciones = e.personal.reduce((s, [, , pct]) => s + remuneracionDe(pct, e.precio), 0);

    // Todo el evento en una transacción: o queda completo o no queda nada
    const ev = await prisma.$transaction(async (tx) => {
      const evento = await tx.evento.create({
        data: {
          tipo: e.tipo,
          fecha,
          hora_inicio: new Date(`${e.fecha}T${e.ini}:00Z`),
          hora_termino: new Date(`${e.fecha}T${e.fin}:00Z`),
          direccion: e.dir,
          precio_acordado: e.precio,
          observaciones: `${MARCA} ${cerrado ? 'evento cerrado' : 'evento realizado'} de prueba`,
          estado: e.estado,
          // RF-P7-09: pagos del cliente − remuneraciones (sin gastos, aportes ni pérdidas)
          rentabilidad_final: cerrado ? totalPagado - totalRemuneraciones : null,
          fecha_cierre: cerrado ? new Date(`${e.fecha}T23:59:00`) : null,
          id_cliente: cliente.id_cliente,
          id_dueno: dueno.id_dueno,
        },
      });

      for (const [tipo_pago, monto, fechaPago] of e.pagos) {
        await tx.pagoCliente.create({
          data: {
            tipo_pago, monto, fecha: new Date(fechaPago), medio_pago: 'Transferencia',
            id_evento: evento.id_evento, id_contador: contador.id_contador,
          },
        });
      }

      for (const [iTrab, iRol, porcentaje] of e.personal) {
        // El trabajador debe saber desempeñar el rol con que se asigna (RF-P2-03)
        await tx.desempena.createMany({
          data: [{ id_trabajador: trabajadores[iTrab].id_trabajador, id_rol: roles[iRol].id_rol }],
          skipDuplicates: true,
        });
        await tx.asignacionPersonal.create({
          data: {
            id_evento: evento.id_evento,
            id_trabajador: trabajadores[iTrab].id_trabajador,
            id_rol: roles[iRol].id_rol,
            id_dueno: dueno.id_dueno,
            porcentaje,
            remuneracion: remuneracionDe(porcentaje, e.precio),
            estado_rendicion: 'SIN_GASTOS',
          },
        });
      }
      return evento;
    });

    creados++;
    const detalle = cerrado ? `resultado final $${(totalPagado - totalRemuneraciones).toLocaleString('es-CL')}` : 'sin cerrar';
    console.log(`Evento ${e.estado}: ID ${ev.id_evento} - ${ev.tipo} (${e.fecha}) · ${detalle}`);
  }
  console.log(`Listo: ${creados} evento(s) pasados nuevos (${EVENTOS_PASADOS.length - creados} ya existían)`);
}


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
  // Eventos pasados cerrados y realizado, para probar el cierre de jornada
  await crearEventosPasados(dueno);
}

main()
  .catch((e) => { console.error('Error al insertar eventos:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());