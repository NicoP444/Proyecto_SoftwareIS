import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('123456', 10);

  // 1. Crear o actualizar Contador de prueba
  const contador = await prisma.contador.upsert({
    where: { correo: 'contador@sixseven.cl' },
    update: { estado: 'ACTIVO', contrasena: hash },
    create: {
      nombre: 'Camila Contador',
      correo: 'contador@sixseven.cl',
      contrasena: hash,
      estado: 'ACTIVO',
    },
  });

  // 2. Crear o actualizar Jefe de Área Técnica de prueba
  const jefe = await prisma.jefeAreaTecnica.upsert({
    where: { correo: 'jefe@sixseven.cl' },
    update: { estado: 'ACTIVO', contrasena: hash },
    create: {
      nombre: 'Javier Jefe Técnico',
      correo: 'jefe@sixseven.cl',
      contrasena: hash,
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