//le da permiso al archivo para conectarse a las tablas
import prisma from '../config/prisma.js';
//para poder comparar contraseñas
import bcrypt from 'bcryptjs';
//
import jwt from 'jsonwebtoken';

// Funcion para ver que usuario es el que intenta entrar 
async function buscarUsuario(correo) {
  const dueno = await prisma.dueno.findUnique({ where: { correo } });
  if (dueno) return { usuario: dueno, rol: 'DUENO', tabla: 'dueno' };

  const contador = await prisma.contador.findUnique({ where: { correo } });
  if (contador) return { usuario: contador, rol: 'CONTADOR', tabla: 'contador' };

    const jefeArea = await prisma.jefeAreaTecnica.findUnique({ where: { correo } });
  if (jefeArea) return { usuario: jefeArea, rol: 'JEFE_TECNICO', tabla: 'jefeAreaTecnica' };

  return null;
}


export async function iniciarSesion(correo, contrasena) {
  // 1. Buscar si el correo existe en alguna tabla
  const cuenta = await buscarUsuario(correo);

  if (!cuenta) {
    throw new Error('Credenciales inválidas');
  }

  const { usuario, rol, tabla } = cuenta;

  // 2. Verificar si la cuenta sigue bloqueada por 15 minutos
  if (usuario.bloqueado_hasta && new Date() < new Date(usuario.bloqueado_hasta)) {
    throw new Error('La cuenta está bloqueada temporalmente. Intente más tarde');
  }

  // 3. Comparar la contraseña escrita con la encriptada
  const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);

  if (!contrasenaValida) {
    // Si la contraseña es incorrecta, manejamos los intentos fallidos
    const nuevosIntentos = usuario.intentos_fallidos + 1;
    const datosActualizar = { intentos_fallidos: nuevosIntentos };

    // Si llega a 5 intentos fallidos, bloqueamos por 15 minutos
    if (nuevosIntentos >= 5) {
      datosActualizar.bloqueado_hasta = new Date(Date.now() + 15 * 60 * 1000);
      datosActualizar.intentos_fallidos = 0; // reiniciamos el contador tras bloquear
    }

    // Actualizamos la tabla dinámica que obtuvimos antes
    const campoId = tabla === 'dueno' ? 'id_dueno' : tabla === 'contador' ? 'id_contador' : 'id_jefe';
    await prisma[tabla].update({
      where: { [campoId]: usuario[campoId] },
      data: datosActualizar
    });

    throw new Error('Credenciales inválidas');
  }


// 4. Si la contraseña es correcta, reiniciamos intentos y bloqueos
  const campoId = tabla === 'dueno' ? 'id_dueno' : tabla === 'contador' ? 'id_contador' : 'id_jefe';
  
  await prisma[tabla].update({
    where: { [campoId]: usuario[campoId] },
    data: {
      intentos_fallidos: 0,
      bloqueado_hasta: null
    }
  });

  // 5. Crear el token JWT (credencial de sesión)
  const token = jwt.sign(
    { id: usuario[campoId], correo: usuario.correo, rol },
    process.env.JWT_SECRET || 'clave_secreta_por_defecto',
    { expiresIn: '8h' }
  );

  // 6. Retornar los datos limpios (sin la contraseña) y el token
  return {
    mensaje: 'Inicio de sesión exitoso',
    token,
    usuario: {
      id: usuario[campoId],
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol
    }
  };
}




