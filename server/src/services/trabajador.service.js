import prisma from '../config/prisma.js'; // llamamos a la base de datos
import { ValidationError } from '../utils/errores.js';// ajusta la ruta a tu PrismaClient

///hfghfghfg
// validar
const VerificarNombre = (nombre, obligatorio = true) => {
    if(nombre === undefined && !obligatorio) return undefined;
    const limpio = String(nombre ?? '').trim().toLowerCase();

    if(!limpio){
        throw new ValidationError('El nombre es obligatorio', 'nombre');
    }
    if(limpio.length > 80){
        throw new ValidationError('El nombre no puede superar 80 caracteres', 'nombre');
    }

    return limpio;
};
const VerificarTelefono = (telefono) => {
  if (telefono === undefined) return undefined;
  if (telefono === null || telefono === '') return null;

  // quitamos espacios y guiones: "+56 9 1234-5678" -> "+56912345678"
  const telefono_l = String(telefono).replace(/[\s-]/g, '');

  if (!/^\+?\d{8,15}$/.test(telefono_l)) {
    throw new ValidationError(
      'El teléfono debe tener solo números, entre 8 y 15 dígitos (ej: +56912345678)',
      'telefono_whatsapp',
    );
  }
  return telefono_l; // el limpio, no el original
};


const VerificarObservacion = (observacion) => {
  if (observacion === undefined) return undefined; // primero undefined
  if (observacion === null || observacion === '') return null;

  const limpia = String(observacion).trim();
  if (limpia.length > 250) {
    throw new ValidationError('La observación no puede superar 250 caracteres', 'observacion');
  }
  return limpia;
};


// id_excluir sirve al actualizar: que no choque con su propio teléfono
const VerificarExistencia = async (telefono, id_excluir) => {
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

const ObtenerTrabajador = async (id_trabajador) => {
  const trabajador = await prisma.trabajador.findUnique({
    where: { id_trabajador: Number(id_trabajador) },
  });

  if (!trabajador) {
    throw new ValidationError('El trabajador no existe', 'id_trabajador');
  }

  return trabajador;
};

export const ListarTrabajadores = (id_dueno) =>
  prisma.trabajador.findMany({
    where: { id_dueno: Number(id_dueno) },
    orderBy: { nombre: 'asc' },
    include: { roles: { include: { rol: true } } }, // trae los roles de cada trabajador
  });

export const CrearTrabajador = async ({ nombre, telefono_whatsapp, observaciones, id_dueno }) => {
  const nom = VerificarNombre(nombre);
  const tel = VerificarTelefono(telefono_whatsapp);
  const obs = VerificarObservacion(observaciones);

  await VerificarExistencia(tel);

  return prisma.trabajador.create({
    data: {
      nombre: nom,
      telefono_whatsapp: tel ?? null,
      observaciones: obs ?? null,
      dueno: { connect: { id_dueno: Number(id_dueno) } },
    },
  });
};


export const ActualizarTrabajador = async (id_trabajador, { nombre, telefono_whatsapp, observaciones }) => {
  await ObtenerTrabajador(id_trabajador);

  const nom = VerificarNombre(nombre, false);
  const tel = VerificarTelefono(telefono_whatsapp);
  const obs = VerificarObservacion(observaciones);

  await VerificarExistencia(tel, id_trabajador);

  return prisma.trabajador.update({
    where: { id_trabajador: Number(id_trabajador) },
    data: {
      ...(nom !== undefined && { nombre: nom }),
      ...(tel !== undefined && { telefono_whatsapp: tel }),
      ...(obs !== undefined && { observaciones: obs }),
    },
  });
};