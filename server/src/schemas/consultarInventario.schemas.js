import { ValidationError } from '../utils/errores.js';

export const ESTADOS_EQUIPO = ['OPERATIVO', 'EN_TERRENO', 'DANADO', 'PERDIDO', 'ROBO', 'BAJA'];

export const validarQueryInventario = (query = {}) => {
  const { estado, busqueda } = query;

  if (estado !== undefined && estado !== '' && !ESTADOS_EQUIPO.includes(String(estado).toUpperCase())) {
    throw new ValidationError(
      `El estado debe ser uno de: ${ESTADOS_EQUIPO.join(', ')}`,
      'estado'
    );
  }

  if (busqueda !== undefined && String(busqueda).trim().length > 100) {
    throw new ValidationError('La búsqueda no puede superar los 100 caracteres', 'busqueda');
  }

  return {
    estado: estado ? String(estado).toUpperCase() : undefined,
    busqueda: busqueda ? String(busqueda).trim() : undefined,
  };
};