import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Creando datos de prueba: 3 Eventos, 3 Kits, 3 Clientes y Personal ---');

  // 1. Dueño base
  let dueno = await prisma.dueno.findFirst();
  if (!dueno) {
    dueno = await prisma.dueno.create({
      data: {
        nombre: 'Dueño Streaming Pro',
        correo: 'admin@streamingpro.cl',
        contrasena: '$2b$10$epNzT696s/1q52zK1zG2ue8dK5cTj9B3l7GqZ4hL9mK7pY1aB2cDe',
      },
    });
  }

  // 2. Tres Clientes
  const clientesData = [
    { nombre: 'Club Deportivo Bío-Bío', telefono: '+56941238910', contacto: 'Felipe Garrido', correo: 'contacto@deportesbiobio.cl' },
    { nombre: 'Municipalidad de Concepción', telefono: '+56978451234', contacto: 'Marcela Soto', correo: 'eventos@concepcion.cl' },
    { nombre: 'Productora Musical Sur', telefono: '+56999887766', contacto: 'Rodrigo Baeza', correo: 'contacto@prosur.cl' },
  ];

  const clientes = [];
  for (const c of clientesData) {
    let cl = await prisma.cliente.findFirst({ where: { nombre: c.nombre } });
    if (!cl) {
      cl = await prisma.cliente.create({ data: { ...c, id_dueno: dueno.id_dueno } });
    }
    clientes.push(cl);
  }

  // 3. Jefe Técnico
  let jefe = await prisma.jefeAreaTecnica.findFirst();
  if (!jefe) {
    jefe = await prisma.jefeAreaTecnica.create({
      data: {
        nombre: 'Andrés Martínez',
        correo: 'jefetecnico@streamingpro.cl',
        contrasena: '$2b$10$epNzT696s/1q52zK1zG2ue8dK5cTj9B3l7GqZ4hL9mK7pY1aB2cDe',
      },
    });
  }

  // 4. Tres Roles de Trabajo
  const rolesNombres = ['Camarógrafo Principal', 'Operador de Sonido', 'Asistente de Transmisión'];
  const roles = [];
  for (const r of rolesNombres) {
    let rol = await prisma.rolTrabajo.findFirst({ where: { nombre: r } });
    if (!rol) {
      rol = await prisma.rolTrabajo.create({ data: { nombre: r, id_dueno: dueno.id_dueno } });
    }
    roles.push(rol);
  }

  // 5. Tres Trabajadores
  const trabajadoresData = [
    { nombre: 'Carlos Carrasco', telefono_whatsapp: '+56912345678' },
    { nombre: 'Sebastián Morales', telefono_whatsapp: '+56987654321' },
    { nombre: 'Valentina Henríquez', telefono_whatsapp: '+56955443322' },
  ];

  const trabajadores = [];
  for (const t of trabajadoresData) {
    let trab = await prisma.trabajador.findFirst({ where: { nombre: t.nombre } });
    if (!trab) {
      trab = await prisma.trabajador.create({ data: { ...t, id_dueno: dueno.id_dueno } });
    }
    trabajadores.push(trab);
  }

  // 6. Tres Kits de Producción (con nombres técnicos reales y en DISPONIBLE)
  const kitsData = [
    { nombre: 'Kit Móvil 01 - Cancha Principal', nivel: 'BASICO' },
    { nombre: 'Kit Multicámara 02 - Gimnasio', nivel: 'BASICO' },
    { nombre: 'Kit Compacto 03 - Entrevistas', nivel: 'BASICO' },
  ];

  const kits = [];
  for (const k of kitsData) {
    let kit = await prisma.kit.findFirst({ where: { nombre: k.nombre } });
    if (!kit) {
      kit = await prisma.kit.create({
        data: {
          nombre: k.nombre,
          nivel: k.nivel,
          id_jefe: jefe.id_jefe,
          estado: 'DISPONIBLE',
        },
      });
    } else {
      await prisma.kit.update({
        where: { id_kit: kit.id_kit },
        data: { estado: 'DISPONIBLE' },
      });
    }
    kits.push(kit);
  }

  // 6.1 Equipos asignados a cada Kit
  const equiposBase = [
  // Equipos para Kit 1
  { codigo: 'CAM-001', nombre: 'Cámara Sony FX3', categoria: 'CAMARA', valor_compra: 3500000, id_kit: kits[0].id_kit },
  { codigo: 'TRI-001', nombre: 'Trípode Manfrotto Pro', categoria: 'TRIPODE', valor_compra: 350000, id_kit: kits[0].id_kit },
  { codigo: 'MIC-001', nombre: 'Micrófono Rode Wireless GO II', categoria: 'MICROFONO', valor_compra: 280000, id_kit: kits[0].id_kit },

  // Equipos para Kit 2
  { codigo: 'CAM-002', nombre: 'Cámara Blackmagic 4K', categoria: 'CAMARA', valor_compra: 1800000, id_kit: kits[1].id_kit },
  { codigo: 'TRI-002', nombre: 'Trípode Benro', categoria: 'TRIPODE', valor_compra: 220000, id_kit: kits[1].id_kit },
  { codigo: 'MIC-002', nombre: 'Micrófono Corbatero Sennheiser', categoria: 'MICROFONO', valor_compra: 320000, id_kit: kits[1].id_kit },

  // Equipos para Kit 3
  { codigo: 'CAM-003', nombre: 'Cámara Canon R6 Mark II', categoria: 'CAMARA', valor_compra: 2400000, id_kit: kits[2].id_kit },
  { codigo: 'TRI-003', nombre: 'Trípode Compacto K&F', categoria: 'TRIPODE', valor_compra: 120000, id_kit: kits[2].id_kit },
  { codigo: 'MIC-003', nombre: 'Micrófono Shure MV88+', categoria: 'MICROFONO', valor_compra: 250000, id_kit: kits[2].id_kit },
];

  for (const eq of equiposBase) {
    let existente = await prisma.equipo.findUnique({ where: { codigo: eq.codigo } });
    if (!existente) {
      await prisma.equipo.create({
        data: {
          codigo: eq.codigo,
          nombre: eq.nombre,
          categoria: eq.categoria,
          valor_compra: eq.valor_compra,
          id_kit: eq.id_kit,
          id_jefe: jefe.id_jefe,
          estado: 'OPERATIVO',
          fecha_compra: new Date(),
        },
      });
    } else {
      await prisma.equipo.update({
        where: { codigo: eq.codigo },
        data: { id_kit: eq.id_kit, estado: 'OPERATIVO' },
      });
    }
  }

  // 7. Tres Eventos y sus reservas de kits
  const ahora = new Date();
  const eventosData = [
    {
      tipo: 'TRANSMISION_FUTBOL',
      direccion: 'Estadio Ester Roa Rebolledo, Concepción',
      precio_acordado: 380000,
      cliente: clientes[0],
      horasAdelanto: 2,
    },
    {
      tipo: 'STREAMING_CONGRESO',
      direccion: 'Salón de Honor Municipalidad de Concepción',
      precio_acordado: 290000,
      cliente: clientes[1],
      horasAdelanto: 24,
    },
    {
      tipo: 'FESTIVAL_MUSICA_SUR',
      direccion: 'Teatro Marina del Sol, Talcahuano',
      precio_acordado: 550000,
      cliente: clientes[2],
      horasAdelanto: 48,
    },
  ];

  for (let i = 0; i < eventosData.length; i++) {
    const ed = eventosData[i];
    const fechaEvento = new Date(ahora.getTime() + ed.horasAdelanto * 60 * 60 * 1000);

    let evento = await prisma.evento.findFirst({
      where: { tipo: ed.tipo },
    });

    if (!evento) {
      evento = await prisma.evento.create({
        data: {
          tipo: ed.tipo,
          fecha: fechaEvento,
          hora_inicio: fechaEvento,
          hora_termino: new Date(fechaEvento.getTime() + 4 * 60 * 60 * 1000),
          direccion: ed.direccion,
          precio_acordado: ed.precio_acordado,
          id_cliente: ed.cliente.id_cliente,
          id_dueno: dueno.id_dueno,
          estado: 'CONFIRMADO',
        },
      });
    }

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

    // Reservar el kit correspondiente al evento
    const kitAsignado = kits[i];
    let reserva = await prisma.reservaKit.findFirst({
      where: { id_evento: evento.id_evento, id_kit: kitAsignado.id_kit },
    });

    if (!reserva) {
      reserva = await prisma.reservaKit.create({
        data: {
          id_evento: evento.id_evento,
          id_kit: kitAsignado.id_kit,
          id_dueno: dueno.id_dueno,
        },
      });
    } else {
      // Limpiar salidas anteriores para que queden listos para probar de nuevo
      await prisma.salidaKit.deleteMany({
        where: { id_reserva: reserva.id_reserva },
      });
    }
  }

  console.log('--- Listo: 3 eventos con sus kits y personal creados correctamente ---');
}

main()
  .catch((e) => console.error('Error al generar datos:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });