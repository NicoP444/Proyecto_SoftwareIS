import { validarId, validarBody, camposObligatorios, validarDueno } from './validate.middleware.js';
import { ValidarListaRoles } from '../schemas/desempena.schemas.js';
import { manejarError } from '../utils/errores.js';

// Igual que validarId, pero para :idRol (validarId solo revisa :id)
export const validarIdRol = (req, res, next) => {
  const idRol = Number(req.params.idRol);
  if (!Number.isInteger(idRol) || idRol <= 0) {
    return res.status(400).json({ mensaje: 'El id del rol no es válido', campo: 'idRol' });
  }
  next();
};

export const verificarSchemaDesempena = (req, res, next) => {
  try {
    // Validamos y limpiamos la lista de roles
    req.body.roles = ValidarListaRoles(req.body.roles);
    next();
  } catch (error) {
    return manejarError(res, error);
  }
};

// validarDueno lee id_dueno del body o, si no viene, de la query (?id_dueno=1)

// GET /trabajadores/:id/roles?id_dueno=1
export const validarListarRolesTrabajador = [validarId, validarDueno];

// PUT /trabajadores/:id/roles   body: { id_dueno: 1, roles: [1, 3, 5] }
export const validarAsignarRoles = [
  validarId,
  validarBody,
  camposObligatorios('id_dueno', 'roles'),
  verificarSchemaDesempena,
  validarDueno,
];

// POST y DELETE /trabajadores/:id/rol/:idRol?id_dueno=1
export const validarTrabajadorRol = [validarId, validarIdRol, validarDueno];

// GET /rol/:idRol/trabajadores?id_dueno=1
export const validarListarTrabajadoresRol = [validarIdRol, validarDueno];