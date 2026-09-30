import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Encriptamos la contraseña "123456"
  const passwordHasheada = await bcrypt.hash('123456', 10);

  // Creamos un dueño de prueba
  const duenoPrueba = await prisma.dueno.create({
    data: {
      nombre: 'Administrador Demo',
      correo: 'admin@demo.com',
      contrasena: passwordHasheada,
      intentos_fallidos: 0
    }
  });

  console.log(' Usuario de prueba creado con éxito:');
  console.log(duenoPrueba);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });