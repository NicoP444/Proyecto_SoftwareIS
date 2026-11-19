import { ValidationError } from '../utils/errores.js';
import prisma from '../config/prisma.js';

export const ValidarNombreUsuario = (nombre) => {
    if (!nombre || !String(nombre).trim()) {
        throw new ValidationError('El nombre del usuario es obligatorio', 'nombre');
    }
    const limpio = String(nombre).trim();
    if (limpio.length < 3 || limpio.length > 80) {
        throw new ValidationError('El nombre debe tener entre 3 y 80 caracteres', 'nombre');
    }
    // Solo permite letras, espacios y acentos (bloquea números puros)
    const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    if (!regexNombre.test(limpio)) {
        throw new ValidationError('El nombre solo debe contener letras y espacios', 'nombre');
    }
    return limpio;
};

export const ValidarCorreo = (correo) => {
    if (!correo || !String(correo).trim()) {
        throw new ValidationError('El correo electrónico es obligatorio', 'correo');
    }
    const limpio = String(correo).trim().toLowerCase();
    // Exige obligatoriamente un dominio con extensión de al menos 2 letras (ej. .com, .cl)
    const regexEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!regexEmail.test(limpio)) {
        throw new ValidationError('El formato del correo electrónico no es válido (debe incluir un dominio como .com o .cl)', 'correo');
    }
    return limpio;
};

export const ValidarRol = (rol) => {
    if (!rol || !String(rol).trim()) {
        throw new ValidationError('El rol del usuario es obligatorio', 'rol');
    }
    const limpio = String(rol).trim().toUpperCase();
    const rolesPermitidos = ['DUENO', 'CONTADOR', 'JEFE_TECNICO'];
    if (!rolesPermitidos.includes(limpio)) {
        throw new ValidationError('El rol debe ser: DUENO, CONTADOR o JEFE_TECNICO', 'rol');
    }
    return limpio;
};

export const VerificarCorreo = (correo) => {
  if (correo === undefined) return undefined; // no viene: no se toca
  if (correo === null || correo === '') return null; // viene vacío: se borra

  const limpio = String(correo).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) {
    throw new ValidationError('El correo debe tener el formato texto@texto.texto', 'correo');
  }
  return limpio;
};