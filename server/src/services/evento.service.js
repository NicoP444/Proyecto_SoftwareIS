import prisma from '../config/prisma.js';

const ID_DUENO_DEMO = 1;
const HORAS_LIMITE_ADELANTO = 5;

export async function listarEventos() {
  return prisma.evento.findMany({
    where: { id_dueno: ID_DUENO_DEMO },
    include: { cliente: true },
    orderBy: [{ fecha: 'asc' }, { hora_inicio: 'asc' }]
  });
}

export async function crearEvento(datos) {
  const cantidadCamaras = Number(datos.cantidad_camaras);
  const precio = Number(datos.precio_acordado);
  const idCliente = Number(datos.id_cliente);

  if (!datos.direccion || !datos.direccion.trim()) {
    throw new Error('Debe indicar la dirección del evento');
  }
  if (!Number.isInteger(cantidadCamaras) || cantidadCamaras < 1) {
    throw new Error('Debe indicar al menos 1 cámara');
  }
  if (!Number.isInteger(precio) || precio <= 0) {
    throw new Error('El precio debe ser mayor a cero');
  }
  if (!Number.isInteger(idCliente) || idCliente <= 0) {
    throw new Error('Debe seleccionar un cliente');
  }

  const inicio = new Date(`${datos.fecha}T${datos.hora_inicio}:00Z`);
  const termino = new Date(`${datos.fecha}T${datos.hora_termino}:00Z`);

  if (termino <= inicio) {
    throw new Error('La hora de término debe ser posterior a la hora de inicio');
  }

  const duracionHoras = (termino - inicio) / (1000 * 60 * 60);
  const estado = duracionHoras >= HORAS_LIMITE_ADELANTO ? 'PENDIENTE_ADELANTO' : 'CONFIRMADO';

  return prisma.evento.create({
    data: {
      tipo: datos.tipo,
      fecha: new Date(datos.fecha),
      hora_inicio: inicio,
      hora_termino: termino,
      direccion: datos.direccion,
      cantidad_camaras: cantidadCamaras,
      precio_acordado: precio,
      observaciones: datos.observaciones || null,
      estado,
      id_cliente: idCliente,
      id_dueno: ID_DUENO_DEMO
    },
    include: { cliente: true }
  });
}

export async function eliminarEvento(id) {
  const pagos = await prisma.pagoCliente.count({ where: { id_evento: id } });
  const incidentes = await prisma.incidente.count({ where: { id_evento: id } });

  if (pagos > 0 || incidentes > 0) {
    throw new Error('No se puede eliminar: la cobertura tiene pagos o incidentes registrados');
  }

  return prisma.evento.delete({ where: { id_evento: id } });
}