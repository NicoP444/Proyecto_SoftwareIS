import 'dotenv/config';
import prisma from '../src/config/prisma.js';

async function main() {
  // 1. Tablas hijas / movimientos
  await prisma.historialCambio.deleteMany();
  await prisma.gastoFijo.deleteMany();
  await prisma.mesContable.deleteMany();
  await prisma.revisa.deleteMany();
  await prisma.incidente.deleteMany();
  await prisma.salidaKit.deleteMany();
  await prisma.reservaKit.deleteMany();
  await prisma.gastoEvento.deleteMany();
  await prisma.pagoRemuneracion.deleteMany();
  await prisma.pagoCliente.deleteMany();
  await prisma.cumplimientoAporte.deleteMany();
  await prisma.acuerdoAuspicio.deleteMany();
  await prisma.asignacionPersonal.deleteMany();

  // 2. Tablas principales de operación
  await prisma.evento.deleteMany();
  await prisma.equipo.deleteMany();
  await prisma.kit.deleteMany();
  await prisma.trabajador.deleteMany();
  await prisma.rolTrabajo.deleteMany();
  await prisma.auspiciador.deleteMany();
  await prisma.cliente.deleteMany();

  // Descomenta estas 3 líneas si también quieres borrar los usuarios:
  // await prisma.contador.deleteMany();
  // await prisma.jefeAreaTecnica.deleteMany();
  // await prisma.dueno.deleteMany();

  console.log('Base de datos vaciada al 100% (solo se conservaron los usuarios).');
}

main()
  .catch((e) => {
    console.error('Error al limpiar la BD:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });