import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Encriptamos la contraseña "123456"
  const passwordHasheada = await bcrypt.hash('123456', 10);

  // Creamos un dueño de prueba
  const duenoPrueba = await prisma.dueno.upsert({
    where: { correo: 'admin@demo.com' },
    update: {},
    create: {
      nombre: 'Administrador Demo',
      correo: 'admin@demo.com',
      contrasena: passwordHasheada,
      intentos_fallidos: 0,
    },
  });

  // Creamos un contador de prueba
  const contadorPrueba = await prisma.contador.upsert({
    where: { correo: 'contador@demo.com' },
    update: {},
    create: {
      nombre: 'Contador Demo',
      correo: 'contador@demo.com',
      contrasena: passwordHasheada,
      intentos_fallidos: 0,
    },
  });

  console.log(' Usuarios de prueba creados con éxito:');
  console.log({ dueno: duenoPrueba, contador: contadorPrueba });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });