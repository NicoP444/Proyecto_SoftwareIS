// Clientes de prueba. Solo crea clientes (los eventos están en seed-eventos.js).
//   Crear:  npm run seed:clientes
//   Borrar: npm run seed:limpiar
// Se puede correr varias veces: si el RUT ya existe, no lo toca.
import 'dotenv/config';
import prisma from '../src/config/prisma.js';

// RUT válidos (con dígito verificador) y sin puntos ni guion, como los guarda el sistema
const CLIENTES = [
  { rut: '111111111', nombre: 'Club Deportivo Los Andes', telefono: '+56911111111', correo: 'andes@test.cl' },
  { rut: '123456785', nombre: 'Municipalidad de Prueba', telefono: '+56922222222', correo: 'muni@test.cl' },
  { rut: '152345674', nombre: 'Colegio San Martín', telefono: '+56933333333' },
  { rut: '178901230', nombre: 'Productora Sur Eventos', telefono: '+56944444444', correo: 'sur@test.cl' },
  { rut: '187654327', nombre: 'Liga Universitaria', telefono: '+56955555555' },
];

async function main() {
  const dueno = await prisma.dueno.findFirst();
  if (!dueno) throw new Error('No existe ningún dueño. Ejecuta primero: npm run seed:base');

  let creados = 0;
  for (const c of CLIENTES) {
    const existe = await prisma.cliente.findUnique({ where: { rut: c.rut } });
    if (existe) continue; // si el RUT ya existe (por ejemplo, uno creado a mano), se deja tal como está
    await prisma.cliente.create({ data: { ...c, id_dueno: dueno.id_dueno } });
    creados++;
    console.log(`Cliente creado: ${c.nombre} (${c.rut})`);
  }
  console.log(`Listo: ${creados} cliente(s) nuevos (${CLIENTES.length - creados} ya existían)`);
}

main()
  .catch((e) => { console.error('Error en seed de clientes:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());