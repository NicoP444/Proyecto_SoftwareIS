import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  let cliente = await prisma.cliente.findFirst();
  let dueno = await prisma.dueno.findFirst();

  if (!dueno) {
    throw new Error('No se encontro ningun registro en la tabla dueno.');
  }

  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        nombre: 'Cliente de Prueba',
        telefono: '+56911223344',
        id_dueno: dueno.id_dueno,
      },
    });
  }

  const eventosData = [
    {
      tipo: 'TRANSMISION_LIGA_REGIONAL',
      fecha: new Date('2026-10-20T00:00:00.000Z'),
      hora_inicio: new Date('2026-10-20T15:00:00.000Z'),
      hora_termino: new Date('2026-10-20T18:00:00.000Z'),
      direccion: 'Estadio Municipal de Concepcion',
      precio_acordado: 220000,
      estado: 'CONFIRMADO',
      id_cliente: cliente.id_cliente,
      id_dueno: dueno.id_dueno,
    },
    {
      tipo: 'COPA_UNIVERSITARIA_OCT',
      fecha: new Date('2026-10-26T00:00:00.000Z'),
      hora_inicio: new Date('2026-10-26T17:00:00.000Z'),
      hora_termino: new Date('2026-10-26T20:00:00.000Z'),
      direccion: 'Gimnasio Universitario',
      precio_acordado: 190000,
      estado: 'CONFIRMADO',
      id_cliente: cliente.id_cliente,
      id_dueno: dueno.id_dueno,
    },
    {
      tipo: 'STREAMING_CHARLA_TECH',
      fecha: new Date('2026-11-02T00:00:00.000Z'),
      hora_inicio: new Date('2026-11-02T10:00:00.000Z'),
      hora_termino: new Date('2026-11-02T13:00:00.000Z'),
      direccion: 'Auditorio Central',
      precio_acordado: 150000,
      estado: 'CONFIRMADO',
      id_cliente: cliente.id_cliente,
      id_dueno: dueno.id_dueno,
    },
    {
      tipo: 'ENCUENTRO_DEPORTIVO_SUR',
      fecha: new Date('2026-11-05T00:00:00.000Z'),
      hora_inicio: new Date('2026-11-05T14:00:00.000Z'),
      hora_termino: new Date('2026-11-05T17:30:00.000Z'),
      direccion: 'Complejo Deportivo',
      precio_acordado: 260000,
      estado: 'CONFIRMADO',
      id_cliente: cliente.id_cliente,
      id_dueno: dueno.id_dueno,
    },
  ];

  for (const item of eventosData) {
    const ev = await prisma.evento.create({ data: item });
    console.log(`Evento creado: ID ${ev.id_evento} - ${ev.tipo}`);
  }
}

main()
  .catch((e) => {
    console.error('Error al insertar eventos:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });