// ============================================================================
//  npm run seed:limpiar  →  deja la base de datos VACÍA de datos.
//  Borra eventos, clientes, personal, roles, kits, equipos, auspiciadores,
//  finanzas, meses contables e historial. Solo se conservan los usuarios
//  (dueño, contador, jefe técnico) y sus sesiones.
//
//  ¡OJO! Borra TODO, también lo que se haya creado a mano desde la app.
//  Úsalo solo en la base de datos de pruebas.
// ============================================================================
import 'dotenv/config';
import { pathToFileURL } from 'url';
import { prisma } from './lib/base.js';

export async function limpiarTodo() {
  // De las tablas que dependen de otras hacia las principales
  const pasos = [
    ['historial de cambios', () => prisma.historialCambio.deleteMany()],
    ['gastos fijos', () => prisma.gastoFijo.deleteMany()],
    ['meses contables', () => prisma.mesContable.deleteMany()],
    ['revisiones de retorno', () => prisma.revisa.deleteMany()],
    ['incidentes', () => prisma.incidente.deleteMany()],
    ['salidas de kits', () => prisma.salidaKit.deleteMany()],
    ['reservas de kits', () => prisma.reservaKit.deleteMany()],
    ['gastos de eventos', () => prisma.gastoEvento.deleteMany()],
    ['pagos de remuneraciones', () => prisma.pagoRemuneracion.deleteMany()],
    ['pagos de clientes', () => prisma.pagoCliente.deleteMany()],
    ['aportes de auspiciadores', () => prisma.cumplimientoAporte.deleteMany()],
    ['acuerdos de auspicio', () => prisma.acuerdoAuspicio.deleteMany()],
    ['asignaciones de personal', () => prisma.asignacionPersonal.deleteMany()],
    ['disponibilidad', () => prisma.disponibilidad.deleteMany()],
    ['roles de cada trabajador', () => prisma.desempena.deleteMany()],
    ['eventos', () => prisma.evento.deleteMany()],
    ['equipos', () => prisma.equipo.deleteMany()],
    ['kits', () => prisma.kit.deleteMany()],
    ['trabajadores', () => prisma.trabajador.deleteMany()],
    ['roles de trabajo', () => prisma.rolTrabajo.deleteMany()],
    ['auspiciadores', () => prisma.auspiciador.deleteMany()],
    ['clientes', () => prisma.cliente.deleteMany()],
  ];

  const resumen = [];
  for (const [nombre, borrar] of pasos) {
    const { count } = await borrar();
    if (count > 0) resumen.push(`${nombre}: ${count}`);
  }
  console.log('Base de datos limpia (los usuarios se conservan).');
  if (resumen.length > 0) console.log(`  Borrado → ${resumen.join(' · ')}`);
}

// Si se ejecuta directo (npm run seed:limpiar) y no importado desde todo.js
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  limpiarTodo()
    .catch((e) => {
      console.error('Error al limpiar:', e.message);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
