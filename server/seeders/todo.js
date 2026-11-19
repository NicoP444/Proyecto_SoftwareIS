// ============================================================================
//  npm run seed:todo  →  deja la base con el SET COMPLETO DE PRUEBAS de SixSeven.
//
//  Primero limpia (igual que seed:limpiar) y después crea, en orden:
//    1. Usuarios ............ dueño, contador, jefe técnico y usuarios de login
//    2. Catálogo ............ roles, personal con disponibilidad, clientes,
//                             auspiciadores, kits y equipos
//    3. Meses anteriores .... hace 2 meses (mes contable cerrado) y el mes pasado
//                             (listo para cerrar)
//    4. Agenda .............. eventos de las próximas semanas
//    5. Casos de prueba ..... C01 a C14, uno por cada etapa del ciclo de un evento
//
//  Todas las fechas son relativas a hoy: el set sirve el día en que se corra.
//  Se puede correr las veces que se quiera: siempre deja el mismo set desde cero.
// ============================================================================
import 'dotenv/config';
import { prisma } from './lib/base.js';
import { limpiarTodo } from './limpiar.js';
import sembrarUsuarios from './datos/01-usuarios.js';
import sembrarCatalogo from './datos/02-catalogo.js';
import sembrarMesesAnteriores from './datos/03-meses-anteriores.js';
import sembrarAgenda from './datos/04-agenda.js';
import sembrarCasos from './datos/05-casos.js';

async function main() {
  await limpiarTodo();
  console.log('');

  const ctx = {}; // cada paso deja aquí lo que creó, para que el siguiente lo use
  await sembrarUsuarios(ctx);
  await sembrarCatalogo(ctx);
  await sembrarMesesAnteriores(ctx);
  await sembrarAgenda(ctx);
  await sembrarCasos(ctx);

  const eventos = await prisma.evento.count();
  console.log(`\nListo: set de pruebas completo (${eventos} eventos). Contraseña de todos los usuarios: 123456`);
}

main()
  .catch((e) => {
    console.error('\nError al crear el set de pruebas:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
