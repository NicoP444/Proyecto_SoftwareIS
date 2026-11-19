import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';

const verificarCorreoUnicoGlobal = async (correoNormalizado, excluir = null) => {
  const [duenoExistente, contadorExistente, jefeExistente] = await Promise.all([
    prisma.dueno.findFirst({ where: { correo: correoNormalizado } }),
    prisma.contador.findFirst({ where: { correo: correoNormalizado } }),
    prisma.jefeAreaTecnica.findFirst({ where: { correo: correoNormalizado } }),
  ]);

  if (duenoExistente) {
    const esMismo =
      excluir &&
      String(excluir.rol).toUpperCase() === 'DUENO' &&
      Number(duenoExistente.id_dueno) === Number(excluir.id);
    if (!esMismo) {
      throw new Error('El correo electrónico ya está registrado en otro usuario del sistema.');
    }
  }

  if (contadorExistente) {
    const esMismo =
      excluir &&
      String(excluir.rol).toUpperCase() === 'CONTADOR' &&
      Number(contadorExistente.id_contador) === Number(excluir.id);
    if (!esMismo) {
      throw new Error('El correo electrónico ya está registrado en otro usuario del sistema.');
    }
  }

  if (jefeExistente) {
    const esMismo =
      excluir &&
      String(excluir.rol).toUpperCase() === 'JEFE_TECNICO' &&
      Number(jefeExistente.id_jefe) === Number(excluir.id);
    if (!esMismo) {
      throw new Error('El correo electrónico ya está registrado en otro usuario del sistema.');
    }
  }
};

const sanitizarUsuario = (registro, rol) => {
  if (!registro) return null;
  const { contrasena, ...sinClave } = registro;
  const id =
    rol === 'DUENO'
      ? registro.id_dueno
      : rol === 'CONTADOR'
      ? registro.id_contador
      : registro.id_jefe;
  return { ...sinClave, id, rol };
};

export const usuarioService = {
  async listarTodos() {
    const [duenos, contadores, jefes] = await Promise.all([
      prisma.dueno.findMany({ orderBy: { id_dueno: 'asc' } }),
      prisma.contador.findMany({ orderBy: { id_contador: 'asc' } }),
      prisma.jefeAreaTecnica.findMany({ orderBy: { id_jefe: 'asc' } }),
    ]);

    return [
      ...duenos.map((d) => sanitizarUsuario(d, 'DUENO')),
      ...contadores.map((c) => sanitizarUsuario(c, 'CONTADOR')),
      ...jefes.map((j) => sanitizarUsuario(j, 'JEFE_TECNICO')),
    ];
  },

  async crear({ nombre, correo, contrasena, rol }) {
    const rolNormalizado = String(rol || '').toUpperCase();
    if (rolNormalizado === 'DUENO') {
      throw new Error('No está permitido crear cuentas con rol Dueño.');
    }
    if (rolNormalizado !== 'CONTADOR' && rolNormalizado !== 'JEFE_TECNICO') {
      throw new Error('El rol seleccionado no es válido.');
    }

    const nombreLimpio = String(nombre || '').trim();
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombreLimpio) || nombreLimpio.length < 2) {
      throw new Error('El nombre solo debe contener letras y espacios.');
    }

    const correoLimpio = String(correo || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      throw new Error('El correo electrónico debe tener formato válido: texto@texto.texto.');
    }

    if (!contrasena || String(contrasena).trim().length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }

    await verificarCorreoUnicoGlobal(correoLimpio);

    const hash = await bcrypt.hash(String(contrasena), 10);

    if (rolNormalizado === 'CONTADOR') {
      const creado = await prisma.contador.create({
        data: {
          nombre: nombreLimpio,
          correo: correoLimpio,
          contrasena: hash,
          estado: 'ACTIVO',
        },
      });
      return sanitizarUsuario(creado, 'CONTADOR');
    }

    const creado = await prisma.jefeAreaTecnica.create({
      data: {
        nombre: nombreLimpio,
        correo: correoLimpio,
        contrasena: hash,
        estado: 'ACTIVO',
      },
    });
    return sanitizarUsuario(creado, 'JEFE_TECNICO');
  },

  async modificar(id, { nombre, correo, rol }) {
    const idNum = Number(id);
    const rolNormalizado = String(rol || '').toUpperCase();

    if (!['DUENO', 'CONTADOR', 'JEFE_TECNICO'].includes(rolNormalizado)) {
      throw new Error('Rol de usuario no válido para modificación.');
    }

    const nombreLimpio = String(nombre || '').trim();
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombreLimpio) || nombreLimpio.length < 2) {
      throw new Error('El nombre solo debe contener letras y espacios.');
    }

    const correoLimpio = String(correo || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      throw new Error('El correo electrónico debe tener formato válido: texto@texto.texto.');
    }

    await verificarCorreoUnicoGlobal(correoLimpio, { id: idNum, rol: rolNormalizado });

    if (rolNormalizado === 'DUENO') {
      const existe = await prisma.dueno.findUnique({ where: { id_dueno: idNum } });
      if (!existe) throw new Error('El usuario Dueño no existe.');
      const actualizado = await prisma.dueno.update({
        where: { id_dueno: idNum },
        data: { nombre: nombreLimpio, correo: correoLimpio },
      });
      return sanitizarUsuario(actualizado, 'DUENO');
    }

    if (rolNormalizado === 'CONTADOR') {
      const existe = await prisma.contador.findUnique({ where: { id_contador: idNum } });
      if (!existe) throw new Error('El usuario Contador no existe.');
      const actualizado = await prisma.contador.update({
        where: { id_contador: idNum },
        data: { nombre: nombreLimpio, correo: correoLimpio },
      });
      return sanitizarUsuario(actualizado, 'CONTADOR');
    }

    const existe = await prisma.jefeAreaTecnica.findUnique({ where: { id_jefe: idNum } });
    if (!existe) throw new Error('El usuario Jefe Técnico no existe.');
    const actualizado = await prisma.jefeAreaTecnica.update({
      where: { id_jefe: idNum },
      data: { nombre: nombreLimpio, correo: correoLimpio },
    });
    return sanitizarUsuario(actualizado, 'JEFE_TECNICO');
  },

  async actualizarEstado(id, { rol, estado }) {
    const idNum = Number(id);
    const rolNormalizado = String(rol || '').toUpperCase();
    const estadoNormalizado = String(estado || '').toUpperCase();

    if (!['ACTIVO', 'INACTIVO'].includes(estadoNormalizado)) {
      throw new Error('El estado debe ser ACTIVO o INACTIVO.');
    }

    if (rolNormalizado === 'DUENO') {
      if (estadoNormalizado === 'INACTIVO') {
        const otrosDuenosActivos = await prisma.dueno.count({
          where: {
            estado: 'ACTIVO',
            NOT: { id_dueno: idNum },
          },
        });
        if (otrosDuenosActivos === 0) {
          throw new Error('No se puede desactivar al último Dueño activo del sistema.');
        }
      }
      const actualizado = await prisma.dueno.update({
        where: { id_dueno: idNum },
        data: { estado: estadoNormalizado },
      });
      return sanitizarUsuario(actualizado, 'DUENO');
    }

    if (rolNormalizado === 'CONTADOR') {
      const actualizado = await prisma.contador.update({
        where: { id_contador: idNum },
        data: { estado: estadoNormalizado },
      });
      return sanitizarUsuario(actualizado, 'CONTADOR');
    }

    if (rolNormalizado === 'JEFE_TECNICO') {
      const actualizado = await prisma.jefeAreaTecnica.update({
        where: { id_jefe: idNum },
        data: { estado: estadoNormalizado },
      });
      return sanitizarUsuario(actualizado, 'JEFE_TECNICO');
    }

    throw new Error('Rol de usuario no válido.');
  },
};