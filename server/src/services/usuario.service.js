import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';

const validarCorreoUnicoGlobal = async (correoNormalizado, excluir = null) => {
  const [duenoExistente, contadorExistente, jefeExistente] = await Promise.all([
    prisma.dueno.findFirst({ where: { correo: correoNormalizado } }),
    prisma.contador.findFirst({ where: { correo: correoNormalizado } }),
    prisma.jefeTecnico.findFirst({ where: { correo: correoNormalizado } }),
  ]);

  if (duenoExistente) {
    const esMismoUsuario =
      excluir &&
      String(excluir.rol).toUpperCase() === 'DUENO' &&
      Number(duenoExistente.id_dueno) === Number(excluir.id);
    if (!esMismoUsuario) {
      throw new Error('El correo electrónico ya está registrado en otro usuario del sistema (Dueño).');
    }
  }

  if (contadorExistente) {
    const esMismoUsuario =
      excluir &&
      String(excluir.rol).toUpperCase() === 'CONTADOR' &&
      Number(contadorExistente.id_contador) === Number(excluir.id);
    if (!esMismoUsuario) {
      throw new Error('El correo electrónico ya está registrado en otro usuario del sistema (Contador).');
    }
  }

  if (jefeExistente) {
    const esMismoUsuario =
      excluir &&
      String(excluir.rol).toUpperCase() === 'JEFE_TECNICO' &&
      Number(jefeExistente.id_jefe) === Number(excluir.id);
    if (!esMismoUsuario) {
      throw new Error('El correo electrónico ya está registrado en otro usuario del sistema (Jefe Técnico).');
    }
  }
};

export const usuarioService = {
  async listarTodos() {
    const [duenos, contadores, jefes] = await Promise.all([
      prisma.dueno.findMany({ orderBy: { id_dueno: 'asc' } }),
      prisma.contador.findMany({ orderBy: { id_contador: 'asc' } }),
      prisma.jefeTecnico.findMany({ orderBy: { id_jefe: 'asc' } }),
    ]);

    const listaDuenos = duenos.map((d) => ({
      id: d.id_dueno,
      id_dueno: d.id_dueno,
      nombre: d.nombre,
      correo: d.correo,
      rol: 'DUENO',
      estado: d.estado,
    }));

    const listaContadores = contadores.map((c) => ({
      id: c.id_contador,
      id_contador: c.id_contador,
      nombre: c.nombre,
      correo: c.correo,
      rol: 'CONTADOR',
      estado: c.estado,
    }));

    const listaJefes = jefes.map((j) => ({
      id: j.id_jefe,
      id_jefe: j.id_jefe,
      nombre: j.nombre,
      correo: j.correo,
      rol: 'JEFE_TECNICO',
      estado: j.estado,
    }));

    return [...listaDuenos, ...listaContadores, ...listaJefes];
  },

  async crear({ nombre, correo, contrasena, rol, id_dueno }) {
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

    await validarCorreoUnicoGlobal(correoLimpio);

    let duenoId = Number(id_dueno);
    let duenoValido = duenoId ? await prisma.dueno.findUnique({ where: { id_dueno: duenoId } }) : null;
    if (!duenoValido) {
      const primerDueno = await prisma.dueno.findFirst();
      duenoId = primerDueno ? primerDueno.id_dueno : 1;
    }

    const hash = await bcrypt.hash(String(contrasena), 10);

    if (rolNormalizado === 'CONTADOR') {
      const creado = await prisma.contador.create({
        data: {
          nombre: nombreLimpio,
          correo: correoLimpio,
          contrasena: hash,
          estado: 'ACTIVO',
          id_dueno: duenoId,
        },
      });
      return { ...creado, id: creado.id_contador, rol: 'CONTADOR' };
    }

    const creado = await prisma.jefeTecnico.create({
      data: {
        nombre: nombreLimpio,
        correo: correoLimpio,
        contrasena: hash,
        estado: 'ACTIVO',
        id_dueno: duenoId,
      },
    });
    return { ...creado, id: creado.id_jefe, rol: 'JEFE_TECNICO' };
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

    await validarCorreoUnicoGlobal(correoLimpio, { id: idNum, rol: rolNormalizado });

    if (rolNormalizado === 'DUENO') {
      const existe = await prisma.dueno.findUnique({ where: { id_dueno: idNum } });
      if (!existe) throw new Error('El usuario Dueño no existe.');
      const actualizado = await prisma.dueno.update({
        where: { id_dueno: idNum },
        data: { nombre: nombreLimpio, correo: correoLimpio },
      });
      return { ...actualizado, id: actualizado.id_dueno, rol: 'DUENO' };
    }

    if (rolNormalizado === 'CONTADOR') {
      const existe = await prisma.contador.findUnique({ where: { id_contador: idNum } });
      if (!existe) throw new Error('El usuario Contador no existe.');
      const actualizado = await prisma.contador.update({
        where: { id_contador: idNum },
        data: { nombre: nombreLimpio, correo: correoLimpio },
      });
      return { ...actualizado, id: actualizado.id_contador, rol: 'CONTADOR' };
    }

    const existe = await prisma.jefeTecnico.findUnique({ where: { id_jefe: idNum } });
    if (!existe) throw new Error('El usuario Jefe Técnico no existe.');
    const actualizado = await prisma.jefeTecnico.update({
      where: { id_jefe: idNum },
      data: { nombre: nombreLimpio, correo: correoLimpio },
    });
    return { ...actualizado, id: actualizado.id_jefe, rol: 'JEFE_TECNICO' };
  },

  async actualizarEstado(id, { rol, estado }) {
    const idNum = Number(id);
    const rolNormalizado = String(rol || '').toUpperCase();
    const estadoNormalizado = String(estado || '').toUpperCase();

    if (!['ACTIVO', 'INACTIVO'].includes(estadoNormalizado)) {
      throw new Error('El estado debe ser ACTIVO o INACTIVO.');
    }

    if (rolNormalizado === 'DUENO') {
      const actualizado = await prisma.dueno.update({
        where: { id_dueno: idNum },
        data: { estado: estadoNormalizado },
      });
      return { ...actualizado, id: actualizado.id_dueno, rol: 'DUENO' };
    }

    if (rolNormalizado === 'CONTADOR') {
      const actualizado = await prisma.contador.update({
        where: { id_contador: idNum },
        data: { estado: estadoNormalizado },
      });
      return { ...actualizado, id: actualizado.id_contador, rol: 'CONTADOR' };
    }

    if (rolNormalizado === 'JEFE_TECNICO') {
      const actualizado = await prisma.jefeTecnico.update({
        where: { id_jefe: idNum },
        data: { estado: estadoNormalizado },
      });
      return { ...actualizado, id: actualizado.id_jefe, rol: 'JEFE_TECNICO' };
    }

    throw new Error('Rol de usuario no válido.');
  },
};