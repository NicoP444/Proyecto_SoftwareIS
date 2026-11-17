import { ValidationError } from '../utils/errores.js';
import prisma from '../config/prisma.js';

// Validar formato y existencia de campos básicos
export const ValidarNombreUsuario = (nombre) => {
    if (!nombre || !String(nombre).trim()) {
        throw new ValidationError('El nombre del usuario es obligatorio', 'nombre');
    }
    const limpio = String(nombre).trim();
    if (limpio.length < 3 || limpio.length > 80) {
        throw new ValidationError('El nombre debe tener entre 3 y 80 caracteres', 'nombre');
    }
    return limpio;
};

export const ValidarCorreo = (correo) => {
    if (!correo || !String(correo).trim()) {
        throw new ValidationError('El correo electrónico es obligatorio', 'correo');
    }
    const limpio = String(correo).trim().toLowerCase();
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(limpio)) {
        throw new ValidationError('El formato del correo electrónico no es válido', 'correo');
    }
    return limpio;
};

export const ValidarRol = (rol) => {
    if (!rol || !String(rol).trim()) {
        throw new ValidationError('El rol del usuario es obligatorio', 'rol');
    }
    const limpio = String(rol).trim().toUpperCase();
    const rolesPermitidos = ['DUENO', 'CONTADOR', 'JEFE_TECNICA'];
    if (!rolesPermitidos.includes(limpio)) {
        throw new ValidationError('El rol debe ser: DUEÑO, CONTADOR o JEFE_DE_AREA_TECNICA', 'rol');
    }
    return limpio;
};

// Verificar que el correo no esté duplicado en ninguna de las 3 tablas del sistema
export const VerificarCorreoUnicoGlobal = async (correo) => {
    const correoLimpio = String(correo).trim().toLowerCase();

    const [dueno, contador, jefe] = await Promise.all([
        prisma.dueno.findUnique({ where: { correo: correoLimpio } }),
        prisma.contador.findUnique({ where: { correo: correoLimpio } }),
        prisma.jefeAreaTecnica.findUnique({ where: { correo: correoLimpio } })
    ]);

    if (dueno || contador || jefe) {
        throw new ValidationError('Este correo electrónico ya está registrado en el sistema', 'correo');
    }
    return true;
};