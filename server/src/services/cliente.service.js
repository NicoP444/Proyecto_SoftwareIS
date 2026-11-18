import prisma from '../config/prisma.js';
import { ValidationError, NotFoundError } from '../utils/errores.js';
import { limpiarRut, rutEsValido } from '../utils/rut.js';

// Valida los datos del cliente y los deja listos para guardar
function prepararDatos(datos) {
  // String(...) evita un error 500 si por la API llega un número u otro tipo de dato
  const rut = limpiarRut(datos.rut);
  const nombre = String(datos.nombre ?? '').trim();
  const telefono = String(datos.telefono ?? '').trim();
  const correo = String(datos.correo ?? '').trim();

  if (!rut) throw new ValidationError('El RUT es obligatorio', 'rut');
  if (!rutEsValido(rut)) throw new ValidationError('El RUT no es válido', 'rut');
  if (!nombre) throw new ValidationError('El nombre es obligatorio', 'nombre');
  if (!telefono) throw new ValidationError('El teléfono es obligatorio', 'telefono');
  if (correo && !/^\S+@\S+\.\S+$/.test(correo)) {
    throw new ValidationError('El correo no es válido', 'correo');
  } 
  // Largos máximos (los mismos de la base de datos y de los campos del formulario)
  if (nombre.length > 80) throw new ValidationError('El nombre no puede superar los 80 caracteres', 'nombre');
  if (telefono.length > 20) throw new ValidationError('El teléfono no puede superar los 20 caracteres', 'telefono');
  if (correo && correo.length > 120) throw new ValidationError('El correo no puede superar los 120 caracteres', 'correo');

  // Teléfono: entre 8 y 15 dígitos (acepta +, espacios y guiones)
  const digitos = telefono.replace(/\D/g, '').length;
  if (digitos < 8 || digitos > 15 || !/^[+\d][\d\s-]*$/.test(telefono)) {
    throw new ValidationError('El teléfono no es válido', 'telefono');
  }
  return { rut, nombre, telefono, correo: correo || null };
}

// Busca un cliente del dueño o lanza 404
async function obtenerCliente(id, idDueno) {
  const cliente = await prisma.cliente.findFirst({
    where: { id_cliente: id, id_dueno: idDueno }
  });
  if (!cliente) throw new NotFoundError('El cliente no existe');
  return cliente;
}

// El RUT es único: error si otro cliente ya lo tiene
async function verificarRutLibre(rut, idActual) {
  const existente = await prisma.cliente.findUnique({ where: { rut } });
  if (existente && existente.id_cliente !== idActual) {
    throw new ValidationError('Ya existe un cliente con ese RUT', 'rut');
  }
}

// buscar (opcional): filtra por nombre o por RUT. limite (opcional): máximo de resultados
export async function listarClientes(idDueno, { buscar = '', limite } = {}) {
  const texto = String(buscar).trim();
  const filtros = [];

  if (texto) {
    filtros.push({ nombre: { contains: texto, mode: 'insensitive' } });
    // solo buscamos por RUT si lo escrito trae números ("12.345", "12345678-5", etc.)
    if (/\d/.test(texto)) filtros.push({ rut: { contains: limpiarRut(texto) } });
  }

  return prisma.cliente.findMany({
    where: { id_dueno: idDueno, ...(filtros.length > 0 && { OR: filtros }) },
    include: { _count: { select: { eventos: true } } }, // para saber si se puede eliminar
    orderBy: { nombre: 'asc' },
    take: limite || undefined
  });
}

export async function crearCliente(idDueno, datos) {
  const data = prepararDatos(datos);
  await verificarRutLibre(data.rut);
  return prisma.cliente.create({ data: { ...data, id_dueno: idDueno } });
}

export async function modificarCliente(idDueno, id, datos) {
  await obtenerCliente(id, idDueno);
  const data = prepararDatos(datos);
  await verificarRutLibre(data.rut, id);
  return prisma.cliente.update({ where: { id_cliente: id }, data });
}

// No se puede eliminar un cliente que tenga eventos asociados
export async function eliminarCliente(idDueno, id) {
  await obtenerCliente(id, idDueno);
  const eventos = await prisma.evento.count({ where: { id_cliente: id } });
  if (eventos > 0) {
    throw new ValidationError(
      `No se puede eliminar: el cliente tiene ${eventos} evento(s) asociado(s)`,
      'id'
    );
  }
  await prisma.cliente.delete({ where: { id_cliente: id } });
}