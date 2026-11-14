import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Crear o actualizar Contador de prueba
  const contador = await prisma.contador.upsert({
    where: { correo: 'contador@sixseven.cl' },
    update: { estado: 'ACTIVO' },
    create: {
      nombre: 'Camila Contador',
      correo: 'contador@sixseven.cl',
      contrasena: 'password123',
      estado: 'ACTIVO',
    },
  });

  // 2. Crear o actualizar Jefe de Área Técnica de prueba
  const jefe = await prisma.jefeAreaTecnica.upsert({
    where: { correo: 'jefe@sixseven.cl' },
    update: { estado: 'ACTIVO' },
    create: {
      nombre: 'Javier Jefe Técnico',
      correo: 'jefe@sixseven.cl',
      contrasena: 'password123',
      estado: 'ACTIVO',
    },
  });

  console.log('Usuarios creados/verificados exitosamente:');
  console.log(`- Contador: ID ${contador.id_contador} | ${contador.nombre} (${contador.correo})`);
  console.log(`- Jefe Área Técnica: ID ${jefe.id_jefe} | ${jefe.nombre} (${jefe.correo})`);
}

main()
  .catch((e) => {
    console.error('Error en seed de usuarios:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });