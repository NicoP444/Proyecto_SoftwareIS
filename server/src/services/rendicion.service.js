import prisma from '../config/prisma.js';
import { ValidationError, NotFoundError } from '../utils/errores.js';

// null se trata igual que PENDIENTE
const filtroPendientes = (id_evento) => ({
  id_evento,
  OR: [{ estado_rendicion: 'PENDIENTE' }, { estado_rendicion: null }],
});

// Listado por evento + conteo para el panel
export const listarRendicionesPorEvento = async (id_evento) => {
  const evento = await prisma.evento.findUnique({ where: { id_evento } });
  if(!evento) throw new NotFoundError('El evento no existe');
  if(!['REALIZADO', 'CERRADO'].includes(evento.estado)){
    throw new ValidationError('El evento aún no está realizado', 'id_evento');
  }

  const asignaciones = await prisma.asignacionPersonal.findMany({
    where: { id_evento },
    include: {
      trabajador: { select: { nombre: true } },
      rol: { select: { nombre: true } },
      _count: { select: { gastos: true } },
    },
    orderBy: { id_asignacion: 'asc' },
  });

  const rendiciones = asignaciones.map((a) => ({
    id_asignacion: a.id_asignacion,
    id_trabajador: a.id_trabajador,
    trabajador: a.trabajador.nombre,
    rol: a.rol.nombre,
    estado_rendicion: a.estado_rendicion ?? 'PENDIENTE',
    cantidad_gastos: a._count.gastos,
  }));

  const resumen = {
    total: rendiciones.length,
    pendientes: rendiciones.filter((r) => r.estado_rendicion === 'PENDIENTE').length,
    rendidas: rendiciones.filter((r) => r.estado_rendicion === 'RENDIDA').length,
    sin_gastos: rendiciones.filter((r) => r.estado_rendicion === 'SIN_GASTOS').length,
  };

  return { id_evento, estado_evento: evento.estado, resumen, rendiciones };
};

// Marcar como RENDIDA o SIN_GASTOS
export const marcarRendicion = async (id_asignacion, { estado_rendicion }) => {
  const asignacion = await prisma.asignacionPersonal.findUnique({
    where: { id_asignacion },
    include: { evento: true, _count: { select: { gastos: true } } },
  });
  if(!asignacion) throw new NotFoundError('La asignación no existe');

  if(asignacion.evento.estado !== 'REALIZADO'){
    throw new ValidationError(
      'Solo se puede marcar la rendición de eventos en estado REALIZADO',
      'id_evento',
    );
  }

  const cantidad = asignacion._count.gastos;
  if(estado_rendicion === 'RENDIDA' && cantidad === 0){
    throw new ValidationError(
      'No se puede marcar como RENDIDA: el trabajador no tiene gastos registrados',
      'estado_rendicion',
    );
  }
  if(estado_rendicion === 'SIN_GASTOS' && cantidad > 0){
    throw new ValidationError(
      'No se puede marcar como SIN_GASTOS: el trabajador ya tiene gastos registrados',
      'estado_rendicion',
    );
  }

  const actualizada = await prisma.asignacionPersonal.update({
    where: { id_asignacion },
    data: { estado_rendicion },
  });

  // Para que el panel muestre cuántas faltan
  const pendientes = await prisma.asignacionPersonal.count({
    where: filtroPendientes(asignacion.id_evento),
  });

  return {
    id_asignacion: actualizada.id_asignacion,
    id_evento: actualizada.id_evento,
    id_trabajador: actualizada.id_trabajador,
    estado_rendicion: actualizada.estado_rendicion,
    pendientes_del_evento: pendientes,
  };
};