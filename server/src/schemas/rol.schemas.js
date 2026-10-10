import { ValidationError } from '../utils/errores.js';
import prisma from '../config/prisma.js'; // Necesario para VerificarDuplicado


export const ValidarPorcentaje = (porcentaje) => {
    if (porcentaje === undefined) return undefined;
    if (porcentaje === null || porcentaje === '') return null;

    const limpio = String(porcentaje).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(limpio)) {
        throw new ValidationError(
            'El porcentaje debe tener un formato numérico válido (ej: 50 o 33.33)', 
            'porcentaje_referencial'
        );
    }
    const numero = Number(limpio);
    
    if (numero < 0 || numero > 100) {
        throw new ValidationError('El porcentaje debe estar entre 0 y 100', 'porcentaje_referencial');
    }
    return Number(numero.toFixed(2));
};


export const ValidarNombreRol = (nombre) => {
    if (!nombre) return null; 
    const limpio = String(nombre).toLowerCase().trim();
    if (limpio.length > 40) {
        throw new ValidationError('El nombre del rol tiene que ser menor a 40 caracteres', 'nombre');
    }
    return limpio; 
};

export const VerificarDuplicado = async (nombre) => {
    const existe = await prisma.rolTrabajo.findUnique({
        where: { nombre: nombre }
    });

    if (existe) {
        throw new ValidationError('Este rol ya está registrado', 'nombre');
    }
    return true;
};
