import { ValidationError } from '../utils/errores.js';
import prisma from '../config/prisma.js'; // Necesario para VerificarDuplicado

// limpiamos el procentaje y verificamos que sea un número entre 0 y 100, con hasta 2 decimales
export const ValidarPorcentaje = (porcentaje) => {
    if (porcentaje === undefined) return undefined;
    if (porcentaje === null || porcentaje === '') return null;

    const limpio = String(porcentaje).trim().replace(',', '.'); // quitamos espacios y aceptamos coma
    if (!/^\d+(\.\d+)?$/.test(limpio)) { // verificamos que sea un número
        throw new ValidationError(
            'El porcentaje debe ser un número válido (ej: 10 o 20)',
            'porcentaje_referencial'
        );
    }
    const numero = Number(limpio);

    if (numero < 0 || numero > 20) { // tope de 20%
        throw new ValidationError('El porcentaje debe estar entre 0 y 20', 'porcentaje_referencial');
    }
    if (!Number.isInteger(numero) || numero % 2 !== 0) { // solo pares, sin decimales
        throw new ValidationError(
            'El porcentaje debe ser un número par, sin decimales (ej: 2, 4, 6...)',
            'porcentaje_referencial'
        );
    }
    return numero;
};

// validamos el nombre del rol, lo limpiamos y verificamos que no supere 10 caracteres
export const ValidarNombreRol = (nombre) => {
    
    if (!nombre || nombre === '' ){
        throw new ValidationError('El nombre del rol es obligatorio', 'nombre');
    }
    
    if (typeof nombre !== 'string') {
        throw new ValidationError('El nombre del rol debe ser una cadena de texto', 'nombre');
    }

    const limpio = String(nombre).toLowerCase().trim();
    if (limpio.length > 25 || limpio.length < 3) {
        throw new ValidationError('El nombre del rol tiene que ser menor a 10 caracteres y mayor a 3', 'nombre');
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(limpio) || typeof limpio == 'number' || typeof limpio == 'bigint') {
        throw new ValidationError('El nombre del rol solo puede contener letras y espacios', 'nombre');
    }
    return limpio; 
};

export const VerificarDuplicado = async (nombre, id_rol = null) => {
    
    if (!nombre || nombre === '') {
        throw new ValidationError('El nombre del rol es obligatorio', 'nombre');
    }
    if (typeof nombre !== 'string') {
        throw new ValidationError('El nombre del rol debe ser una cadena de texto', 'nombre');
    }
    
    // Buscamos si el nombre ya existe excluyendo el id actual si estamos actualizando
    const existe = await prisma.rolTrabajo.findFirst({
        where: { 
            nombre: nombre,
            ...(id_rol ? { id_rol: { not: Number(id_rol) } } : {})
        }
    });

    if (existe) {
        throw new ValidationError('Este rol ya está registrado', 'nombre');
    }
    return true;
};
