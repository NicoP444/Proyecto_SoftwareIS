import { ValidationError } from '../utils/errores.js';
import prisma from '../config/prisma.js'; // Necesario para VerificarDuplicado

// validamos el nombre, lo limpiamos y verificamos que no supere 25 caracteres
export const VerificarNombre = (nombre, obligatorio = true) => {
    if(nombre === undefined && !obligatorio) return undefined;
    const limpio = String(nombre ?? '').trim().toLowerCase();

    if(!limpio){//verificamos que no venga vacío
        throw new ValidationError('El nombre es obligatorio', 'nombre');
    }
    if(limpio.length > 25 || limpio.length < 3){
        throw new ValidationError('El nombre no puede superar 25 y ser menor a 3 caracteres', 'nombre');
    }
    if(!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(limpio) || typeof limpio == 'number' || typeof limpio == 'bigint'){
        throw new ValidationError('El nombre solo puede contener letras y espacios', 'nombre');
    }

    return limpio;
};

export const VerificarTelefono = (telefono) => { // verificamos que el teléfono sea válido, lo limpiamos y lo devolvemos
  if (telefono === undefined) return undefined;
  if (telefono === null || telefono === '') return null;

  // quitamos espacios y guiones: "+56 9 1234-5678" -> "+56912345678"
  const telefono_l = String(telefono).replace(/[\s-]/g, '');

  if (!/^\+?\d{8,15}$/.test(telefono_l)) { // verificamos que tenga solo números, entre 8 y 15 dígitos, con o sin prefijo "+"
    throw new ValidationError(
      'El teléfono debe tener solo números, entre 8 y 15 dígitos (ej: +56912345678)',
      'telefono_whatsapp',
    );
  }
  return telefono_l; // el limpio, no el original
};


export const VerificarObservacion = (observacion) => {
  if (observacion === undefined) return undefined; // primero undefined
  if (observacion === null || observacion === '') return null;
 
  const limpia = String(observacion).trim();
  
  if (limpia.length > 250) {
    throw new ValidationError('La observación no puede superar 250 caracteres', 'observacion');
  }

  if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,;:()\-]+$/.test(limpia)) {
    throw new ValidationError('La observación solo puede contener letras, números y algunos signos de puntuación', 'observacion');
  }
  return limpia;
};


// id_excluir sirve al actualizar: que no choque con su propio teléfono
export const VerificarExistencia = async (telefono, id_excluir) => {
  if (!telefono) return;

  const existe = await prisma.trabajador.findFirst({
    where: {
      telefono_whatsapp: telefono,
      ...(id_excluir && { NOT: { id_trabajador: Number(id_excluir) } }),
    },
  });

  if (existe) {
    throw new ValidationError('El teléfono ya está registrado', 'telefono_whatsapp');
  }
};

export const VerificarCorreo = (correo) => {
  if (correo === undefined) return undefined;          // no viene: no se toca
  if (correo === null || correo === '') return null;   // viene vacío: se borra

  const limpio = String(correo).trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(limpio)) {
    throw new ValidationError('El correo no es válido', 'correo');
  }
  return limpio;
};

export const VerificarExistenciaCorreo = async (correo, id_excluir) => {
  if (correo === undefined) return undefined;
  if (correo === null || correo === '') return null;

  const limpio = String(correo).trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(limpio)) {
    throw new ValidationError('El correo no es válido', 'correo');
  }

  const existe = await prisma.trabajador.findFirst({
    where: {
      correo: limpio,
      ...(id_excluir && { NOT: { id_trabajador: Number(id_excluir) } }),
    },
  });
  if (existe) {
    throw new ValidationError('El correo ya está registrado', 'correo');
  }
  return limpio;
};