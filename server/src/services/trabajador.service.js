import prisma from '../config/prisma.js'; // llamamos a la base de datos
import { ValidationError } from '../utils/errores.js';// ajusta la ruta a tu PrismaClient


const ObtenerTrabajador = async (id_trabajador) => {
  const trabajador = await prisma.trabajador.findUnique({
    where: { id_trabajador: Number(id_trabajador) },
  });

  if (!trabajador) {
    throw new ValidationError('El trabajador no existe', 'id_trabajador');
  }

  return trabajador;
};

export const ListarTrabajadores = async (id_dueno) => {
  const trabajadores = await prisma.trabajador.findMany({
    where: { id_dueno: Number(id_dueno) },
    orderBy: { nombre: 'asc' },
    include: { roles: { include: { rol: true } } },
  });

  // El front usa minúscula: 'ACTIVO' -> 'activo'
  return trabajadores.map((t) => ({ ...t, estado: t.estado.toLowerCase() }));
};



const ESTADOS_VALIDOS = ['ACTIVO', 'LICENCIA', 'INACTIVO'];

const VerificarEstado = (estado, obligatorio = true) => {
  if (estado === undefined && !obligatorio) return undefined;
  if (estado === undefined || estado === null || estado === '') return 'ACTIVO';

  const limpio = String(estado).trim().toUpperCase(); // 'licencia' -> 'LICENCIA'
  if (!ESTADOS_VALIDOS.includes(limpio)) {
    throw new ValidationError('El estado debe ser activo, licencia o inactivo', 'estado');
  }
  return limpio;
};

export const CrearTrabajador = async ({ nombre, telefono_whatsapp, correo, observaciones, id_dueno, estado }) => {
  const nom = VerificarNombre(nombre);
  const tel = VerificarTelefono(telefono_whatsapp);
  const cor = VerificarCorreo(correo);
  const obs = VerificarObservacion(observaciones);
  const est = VerificarEstado(estado);
  await VerificarExistencia(tel);
  await VerificarExistenciaCorreo(cor, null);

  return prisma.trabajador.create({
    data: {
      nombre: nom,
      telefono_whatsapp: tel ?? null,
      correo: cor ?? null,
      observaciones: obs ?? null,
      estado: est,
      dueno: { connect: { id_dueno: Number(id_dueno) } },
    },
  });
};


export const ActualizarTrabajador = async (id_trabajador, { nombre, telefono_whatsapp, correo, observaciones, estado }) => {
  await ObtenerTrabajador(id_trabajador);

  const nom = VerificarNombre(nombre, false);
  const tel = VerificarTelefono(telefono_whatsapp);
  const cor = VerificarCorreo(correo);
  const obs = VerificarObservacion(observaciones);
  const est = VerificarEstado(estado, false);

  await VerificarExistencia(tel, id_trabajador);

  return prisma.trabajador.update({
    where: { id_trabajador: Number(id_trabajador) },
    data: {
      ...(nom !== undefined && { nombre: nom }),
      ...(tel !== undefined && { telefono_whatsapp: tel }),
      ...(cor !== undefined && { correo: cor }),
      ...(obs !== undefined && { observaciones: obs }),
      ...(est !== undefined && { estado: est }),
    },
  });
};