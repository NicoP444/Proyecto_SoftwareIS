import { ValidationError } from '../utils/errores.js';
 
// Valida y limpia la lista de roles que llega del modal
// Esperado: [1, 3, 5]   ([] = quitarle todos los roles)
export const ValidarListaRoles = (roles) => {
  if (!Array.isArray(roles)) {
    throw new ValidationError('roles debe ser un arreglo de ids', 'roles');
  }
 
  const ids = roles.map(Number); // por si llegan como texto: "3" → 3
 
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new ValidationError('Todos los roles deben ser ids enteros mayores a 0', 'roles');
  }
 
  return [...new Set(ids)]; // elimina repetidos
};
 