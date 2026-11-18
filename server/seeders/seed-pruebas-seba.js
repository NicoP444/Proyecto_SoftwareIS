import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma.js';

async function main() {
  const hash = await bcrypt.hash('123456', 10);

  // 1. Usuarios base (clave: 123456)
  const dueno = await prisma.dueno.upsert({
    where: { correo: 'dueno@sixseven.cl' },
    update: { contrasena: hash, estado: 'ACTIVO' },
    create: {
      nombre: 'Diego Dueño',
      correo: 'dueno@sixseven.cl',
      contrasena: hash,
      estado: 'ACTIVO',
    },
  });

  const jefe = await prisma.jefeAreaTecnica.upsert({
    where: { correo: 'jefe@sixseven.cl' },
    update: { contrasena: hash, estado: 'ACTIVO' },
    create: {
      nombre: 'Javier Jefe Técnico',
      correo: 'jefe@sixseven.cl',
      contrasena: hash,
      estado: 'ACTIVO',
    },
  });

  await prisma.contador.upsert({
    where: { correo: 'contador@sixseven.cl' },
    update: { contrasena: hash, estado: 'ACTIVO' },
    create: {
      nombre: 'Camila Contador',
      correo: 'contador@sixseven.cl',
      contrasena: hash,
      estado: 'ACTIVO',
    },
  });

  // 2. Clientes base (rut: máx 10 caracteres, único)
  const cliente1 = await prisma.cliente.create({
    data: {
      rut: '76111222-3',
      nombre: 'Club Deportivo Los Andes',
      contacto: 'Roberto Paredes',
      telefono: '+56911111111',
      correo: 'contacto@losandes.cl',
      id_dueno: dueno.id_dueno,
    },
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      rut: '76444555-6',
      nombre: 'Liga Universitaria Bío-Bío',
      contacto: 'Andrea Muñoz',
      telefono: '+56922222222',
      correo: 'eventos@ligabiobio.cl',
      id_dueno: dueno.id_dueno,
    },
  });

  // 3. Roles y Trabajadores (sin asignar a eventos)
  await prisma.rolTrabajo.createMany({
    data: [
      { nombre: 'Camarógrafo Principal', porcentaje_referencial: 15, id_dueno: dueno.id_dueno },
      { nombre: 'Operador de Switch', porcentaje_referencial: 15, id_dueno: dueno.id_dueno },
      { nombre: 'Sonidista', porcentaje_referencial: 10, id_dueno: dueno.id_dueno },
      { nombre: 'Asistente de Transmisión', porcentaje_referencial: 10, id_dueno: dueno.id_dueno },
    ],
  });

  await prisma.trabajador.createMany({
    data: [
      { nombre: 'Carlos Carrasco', telefono_whatsapp: '+56987654321', correo: 'carlos@sixseven.cl', id_dueno: dueno.id_dueno },
      { nombre: 'Sebastián Morales', telefono_whatsapp: '+56987654322', correo: 'sebastian@sixseven.cl', id_dueno: dueno.id_dueno },
      { nombre: 'Valentina Henríquez', telefono_whatsapp: '+56987654323', correo: 'valentina@sixseven.cl', id_dueno: dueno.id_dueno },
      { nombre: 'Matías Soto', telefono_whatsapp: '+56987654324', correo: 'matias@sixseven.cl', id_dueno: dueno.id_dueno },
    ],
  });

  // 4. Kits disponibles con sus equipos integrados + repuestos sueltos
  const kit1 = await prisma.kit.create({
    data: {
      nombre: 'Kit Móvil 01 - Cancha Principal',
      nivel: 'BASICO',
      recargo_pct: 0,
      estado: 'DISPONIBLE',
      id_jefe: jefe.id_jefe,
    },
  });

  const kit2 = await prisma.kit.create({
    data: {
      nombre: 'Kit Pro 02 - Multicámara HD',
      nivel: 'ESTANDAR',
      recargo_pct: 15,
      estado: 'DISPONIBLE',
      id_jefe: jefe.id_jefe,
    },
  });

  const kit3 = await prisma.kit.create({
    data: {
      nombre: 'Kit Alta Gama 03 - Estadio',
      nivel: 'ALTA_GAMA',
      recargo_pct: 25,
      estado: 'DISPONIBLE',
      id_jefe: jefe.id_jefe,
    },
  });

  await prisma.equipo.createMany({
    data: [
      // Kit 1
      { codigo: 'CAM-001', nombre: 'Cámara Sony FX3', categoria: 'CAMARA', marca: 'Sony', modelo: 'FX3', fecha_compra: new Date('2026-01-15'), valor_compra: 1500000, estado: 'OPERATIVO', id_kit: kit1.id_kit, id_jefe: jefe.id_jefe },
      { codigo: 'TRI-001', nombre: 'Trípode Benro Pro', categoria: 'TRIPODE', marca: 'Benro', modelo: 'A373F', fecha_compra: new Date('2026-01-15'), valor_compra: 180000, estado: 'OPERATIVO', id_kit: kit1.id_kit, id_jefe: jefe.id_jefe },
      { codigo: 'MIC-001', nombre: 'Micrófono Rode Wireless', categoria: 'MICROFONO', marca: 'Rode', modelo: 'Wireless GO II', fecha_compra: new Date('2026-01-15'), valor_compra: 220000, estado: 'OPERATIVO', id_kit: kit1.id_kit, id_jefe: jefe.id_jefe },
      { codigo: 'SWI-001', nombre: 'Switch ATEM Mini', categoria: 'SWITCH_VIDEO', marca: 'Blackmagic', modelo: 'ATEM Mini', fecha_compra: new Date('2026-01-15'), valor_compra: 350000, estado: 'OPERATIVO', id_kit: kit1.id_kit, id_jefe: jefe.id_jefe },

      // Kit 2
      { codigo: 'CAM-002', nombre: 'Cámara Blackmagic 6K', categoria: 'CAMARA', marca: 'Blackmagic', modelo: 'Pocket 6K', fecha_compra: new Date('2026-02-10'), valor_compra: 2100000, estado: 'OPERATIVO', id_kit: kit2.id_kit, id_jefe: jefe.id_jefe },
      { codigo: 'TRI-002', nombre: 'Trípode Manfrotto Heavy', categoria: 'TRIPODE', marca: 'Manfrotto', modelo: '504X', fecha_compra: new Date('2026-02-10'), valor_compra: 320000, estado: 'OPERATIVO', id_kit: kit2.id_kit, id_jefe: jefe.id_jefe },
      { codigo: 'MIC-002', nombre: 'Micrófono Sennheiser EW', categoria: 'MICROFONO', marca: 'Sennheiser', modelo: 'EW-DP', fecha_compra: new Date('2026-02-10'), valor_compra: 410000, estado: 'OPERATIVO', id_kit: kit2.id_kit, id_jefe: jefe.id_jefe },
      { codigo: 'SWI-002', nombre: 'Switch ATEM Extreme ISO', categoria: 'SWITCH_VIDEO', marca: 'Blackmagic', modelo: 'Extreme ISO', fecha_compra: new Date('2026-02-10'), valor_compra: 890000, estado: 'OPERATIVO', id_kit: kit2.id_kit, id_jefe: jefe.id_jefe },

      // Kit 3
      { codigo: 'CAM-003', nombre: 'Cámara Sony A7 IV', categoria: 'CAMARA', marca: 'Sony', modelo: 'A7 IV', fecha_compra: new Date('2026-03-05'), valor_compra: 1400000, estado: 'OPERATIVO', id_kit: kit3.id_kit, id_jefe: jefe.id_jefe },
      { codigo: 'TRI-003', nombre: 'Trípode Compacto Travel', categoria: 'TRIPODE', marca: 'Benro', modelo: 'Slim', fecha_compra: new Date('2026-03-05'), valor_compra: 110000, estado: 'OPERATIVO', id_kit: kit3.id_kit, id_jefe: jefe.id_jefe },
      { codigo: 'MIC-003', nombre: 'Micrófono Shotgun', categoria: 'MICROFONO', marca: 'Rode', modelo: 'VideoMic NTG', fecha_compra: new Date('2026-03-05'), valor_compra: 240000, estado: 'OPERATIVO', id_kit: kit3.id_kit, id_jefe: jefe.id_jefe },
      { codigo: 'SWI-003', nombre: 'Capturadora Roland V-1HD', categoria: 'SWITCH_VIDEO', marca: 'Roland', modelo: 'V-1HD', fecha_compra: new Date('2026-03-05'), valor_compra: 480000, estado: 'OPERATIVO', id_kit: kit3.id_kit, id_jefe: jefe.id_jefe },

      // Repuestos libres en bodega (sin kit)
      { codigo: 'REP-CAM-01', nombre: 'Cámara Repuesto Sony ZV-E10', categoria: 'CAMARA', marca: 'Sony', modelo: 'ZV-E10', fecha_compra: new Date('2026-04-01'), valor_compra: 750000, estado: 'OPERATIVO', id_kit: null, id_jefe: jefe.id_jefe },
      { codigo: 'REP-MIC-01', nombre: 'Micrófono Repuesto Corbatero', categoria: 'MICROFONO', marca: 'Sony', modelo: 'ECM-W2BT', fecha_compra: new Date('2026-04-01'), valor_compra: 190000, estado: 'OPERATIVO', id_kit: null, id_jefe: jefe.id_jefe },
    ],
  });

  // 5. Eventos (CONFIRMADOS + PENDIENTE_ADELANTO para probar el flujo completo desde cero)
  await prisma.evento.createMany({
    data: [
      // --- CONFIRMADOS ---
      {
        tipo: 'Torneo Regional Ayer (Pasado)',
        fecha: new Date('2026-11-17T00:00:00.000Z'),
        hora_inicio: new Date('1970-01-01T15:00:00.000Z'),
        hora_termino: new Date('1970-01-01T18:00:00.000Z'),
        direccion: 'Estadio Municipal Collao, Concepción',
        precio_acordado: 450000,
        estado: 'CONFIRMADO',
        id_cliente: cliente1.id_cliente,
        id_dueno: dueno.id_dueno,
      },
      {
        tipo: 'Matinal Deportivo Hoy (Ya Terminó)',
        fecha: new Date('2026-11-18T00:00:00.000Z'),
        hora_inicio: new Date('1970-01-01T08:00:00.000Z'),
        hora_termino: new Date('1970-01-01T10:30:00.000Z'),
        direccion: 'Gimnasio UdeC, Concepción',
        precio_acordado: 320000,
        estado: 'CONFIRMADO',
        id_cliente: cliente2.id_cliente,
        id_dueno: dueno.id_dueno,
      },
      {
        tipo: 'Copa Mediodía Hoy (En Curso)',
        fecha: new Date('2026-11-18T00:00:00.000Z'),
        hora_inicio: new Date('1970-01-01T11:30:00.000Z'),
        hora_termino: new Date('1970-01-01T14:30:00.000Z'),
        direccion: 'Cancha Sintética San Pedro',
        precio_acordado: 500000,
        estado: 'CONFIRMADO',
        id_cliente: cliente1.id_cliente,
        id_dueno: dueno.id_dueno,
      },
      {
        tipo: 'Partido Nocturno Hoy (Más Tarde)',
        fecha: new Date('2026-11-18T00:00:00.000Z'),
        hora_inicio: new Date('1970-01-01T19:00:00.000Z'),
        hora_termino: new Date('1970-01-01T22:00:00.000Z'),
        direccion: 'Estadio Ester Roa, Concepción',
        precio_acordado: 650000,
        estado: 'CONFIRMADO',
        id_cliente: cliente1.id_cliente,
        id_dueno: dueno.id_dueno,
      },
      {
        tipo: 'Final Semifinal Mañana (Futuro +1)',
        fecha: new Date('2026-11-19T00:00:00.000Z'),
        hora_inicio: new Date('1970-01-01T17:00:00.000Z'),
        hora_termino: new Date('1970-01-01T20:00:00.000Z'),
        direccion: 'Polideportivo Los Ángeles',
        precio_acordado: 550000,
        estado: 'CONFIRMADO',
        id_cliente: cliente2.id_cliente,
        id_dueno: dueno.id_dueno,
      },
      {
        tipo: 'Gala Clausura Pasado Mañana (+2)',
        fecha: new Date('2026-11-20T00:00:00.000Z'),
        hora_inicio: new Date('1970-01-01T18:00:00.000Z'),
        hora_termino: new Date('1970-01-01T21:30:00.000Z'),
        direccion: 'Teatro Universidad de Concepción',
        precio_acordado: 750000,
        estado: 'CONFIRMADO',
        id_cliente: cliente1.id_cliente,
        id_dueno: dueno.id_dueno,
      },

      // --- PENDIENTES DE ADELANTO (Para probar flujo completo desde pago del 50%) ---
      {
        tipo: 'Maratón Ayer (Pendiente Adelanto)',
        fecha: new Date('2026-11-17T00:00:00.000Z'),
        hora_inicio: new Date('1970-01-01T09:00:00.000Z'),
        hora_termino: new Date('1970-01-01T15:00:00.000Z'),
        direccion: 'Parque Ecuador, Concepción',
        precio_acordado: 600000,
        estado: 'PENDIENTE_ADELANTO',
        id_cliente: cliente1.id_cliente,
        id_dueno: dueno.id_dueno,
      },
      {
        tipo: 'Campeonato Hoy (Pendiente Adelanto)',
        fecha: new Date('2026-11-18T00:00:00.000Z'),
        hora_inicio: new Date('1970-01-01T08:00:00.000Z'),
        hora_termino: new Date('1970-01-01T14:00:00.000Z'),
        direccion: 'Club de Campo Bellavista',
        precio_acordado: 400000,
        estado: 'PENDIENTE_ADELANTO',
        id_cliente: cliente2.id_cliente,
        id_dueno: dueno.id_dueno,
      },
      {
        tipo: 'Festival Mañana (Pendiente Adelanto)',
        fecha: new Date('2026-11-19T00:00:00.000Z'),
        hora_inicio: new Date('1970-01-01T14:00:00.000Z'),
        hora_termino: new Date('1970-01-01T20:00:00.000Z'),
        direccion: 'Costanera Chiguayante',
        precio_acordado: 800000,
        estado: 'PENDIENTE_ADELANTO',
        id_cliente: cliente1.id_cliente,
        id_dueno: dueno.id_dueno,
      },
    ],
  });

  console.log('Seed de pruebas ejecutado correctamente (6 CONFIRMADOS + 3 PENDIENTE_ADELANTO).');
}

main()
  .catch((e) => {
    console.error('Error ejecutando seed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });