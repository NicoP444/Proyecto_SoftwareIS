import prisma from '../config/prisma.js';
import fs from 'fs/promises';
import { ValidationError, NotFoundError } from '../utils/errores.js';
import { origenDestino } from '../schemas/gastoEvento.schemas.js';

const iso = (fecha) => fecha.toISOString().slice(0, 10);
const resumen = (g) => `${g.tipo_gasto} $${g.monto} (${iso(g.fecha)})`.slice(0, 255);

const borrarArchivo = (ruta) => fs.unlink(ruta).catch(() => {});

const verificarEventoAbierto = (evento) => {
  if(evento.estado === 'CERRADO'){
    throw new ValidationError('El evento está cerrado, no se pueden modificar sus gastos', 'id_evento');
  }
};

// ---------- RF-P7-02: registrar ----------
export const crearGasto = async (datos) => {
  try{
    const evento = await prisma.evento.findUnique({ where: { id_evento: datos.id_evento } });
    if(!evento) throw new NotFoundError('El evento no existe');
    verificarEventoAbierto(evento);

    // El gasto se asocia al evento a través de la asignación del trabajador
    const asignacion = await prisma.asignacionPersonal.findUnique({
      where: {
        id_evento_id_trabajador: { id_evento: datos.id_evento, id_trabajador: datos.id_trabajador },
      },
    });
    if(!asignacion){
      throw new NotFoundError('El trabajador no está asignado a este evento');
    }

    const { id_evento, id_trabajador, ...resto } = datos;

    return await prisma.$transaction(async (tx) => {
      const { id_evento, id_trabajador, ...resto } = datos;

      return await prisma.gastoEvento.create({
      data: { ...resto, id_asignacion: asignacion.id_asignacion },
    });
    });
  }catch (error){
    await borrarArchivo(datos.evidencia); // no dejar archivos huérfanos si falla
    throw error;
  }
};

// ---------- Listar gastos de un evento ----------
export const listarGastosPorEvento = async (id_evento) => {
  const evento = await prisma.evento.findUnique({ where: { id_evento } });
  if(!evento) throw new NotFoundError('El evento no existe');

  return prisma.gastoEvento.findMany({
    where: { asignacion: { id_evento } },
    include: {
      asignacion: { select: { id_trabajador: true, trabajador: { select: { nombre: true } } } },
    },
    orderBy: { fecha: 'asc' },
  });
};

// ---------- RF-P7-03: modificar ----------
export const modificarGasto = async (id_gasto, datos) => {
  const { id_contador, motivo, id_trabajador, ...cambios } = datos;

  try{
    const gasto = await prisma.gastoEvento.findUnique({
      where: { id_gasto },
      include: { asignacion: { include: { evento: true } } },
    });
    if(!gasto) throw new NotFoundError('El gasto no existe');

    const evento = gasto.asignacion.evento;
    verificarEventoAbierto(evento);

    // Si cambia de trabajador, debe estar asignado al mismo evento
    let id_asignacion = gasto.id_asignacion;
    if(id_trabajador !== undefined && id_trabajador !== gasto.asignacion.id_trabajador){
      const nueva = await prisma.asignacionPersonal.findUnique({
        where: { id_evento_id_trabajador: { id_evento: evento.id_evento, id_trabajador } },
      });
      if(!nueva) throw new NotFoundError('El trabajador no está asignado a este evento');
      id_asignacion = nueva.id_asignacion;
      cambios.id_asignacion = id_asignacion;
    }

    // Revalidar la regla de movilización con el estado final del gasto
    const tipoFinal = cambios.tipo_gasto ?? gasto.tipo_gasto;
    const od = origenDestino(tipoFinal, {
      origen: cambios.origen !== undefined ? cambios.origen : gasto.origen,
      destino: cambios.destino !== undefined ? cambios.destino : gasto.destino,
    });
    cambios.origen = od.origen;
    cambios.destino = od.destino;

    // Armamos el historial solo con lo que realmente cambió
    const filas = [];
    for(const [campo, nuevo] of Object.entries(cambios)){
      let anterior = gasto[campo];
      let valorNuevo = nuevo;
      if(campo === 'fecha'){ anterior = iso(anterior); valorNuevo = iso(nuevo); }
      if(campo === 'id_asignacion'){
        anterior = gasto.asignacion.id_trabajador;
        valorNuevo = id_trabajador;
      }
      if((anterior ?? null) === (valorNuevo ?? null)) { delete cambios[campo]; continue; }

      filas.push({
        tabla_afectada: 'gasto_evento',
        dato: `gasto #${id_gasto}: ${campo === 'id_asignacion' ? 'trabajador' : campo}`.slice(0, 60),
        valor_anterior: anterior === null || anterior === undefined ? null : String(anterior).slice(0, 255),
        valor_nuevo: valorNuevo === null || valorNuevo === undefined ? null : String(valorNuevo).slice(0, 255),
        motivo,
        id_contador,
        id_evento: evento.id_evento,
      });
    }

    if(filas.length === 0){
      throw new ValidationError('No hay cambios respecto al gasto actual');
    }

    return await prisma.$transaction(async (tx) => {
      const actualizado = await tx.gastoEvento.update({
        where: { id_gasto },
        data: { ...cambios, id_contador },
      });
      await tx.historialCambio.createMany({ data: filas });
      return actualizado;
    });
  }catch (error){
    if(datos.evidencia) await borrarArchivo(datos.evidencia); // la nueva evidencia no se usó
    throw error;
  }
};

// ---------- RF-P7-03: eliminar ----------
export const eliminarGasto = async (id_gasto, { id_contador, motivo }) => {
  const gasto = await prisma.gastoEvento.findUnique({
    where: { id_gasto },
    include: { asignacion: { include: { evento: true } } },
  });
  if(!gasto) throw new NotFoundError('El gasto no existe');

  const evento = gasto.asignacion.evento;
  verificarEventoAbierto(evento);

  await prisma.$transaction(async (tx) => {
    await tx.historialCambio.create({
      data: {
        tabla_afectada: 'gasto_evento',
        dato: `gasto #${id_gasto}: eliminado`,
        valor_anterior: resumen(gasto),
        valor_nuevo: null,
        motivo,
        id_contador,
        id_evento: evento.id_evento,
      },
    });
    await tx.gastoEvento.delete({ where: { id_gasto } });
  });
  // El archivo de evidencia se conserva en disco como respaldo de auditoría
};