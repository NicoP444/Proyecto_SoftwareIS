import * as service from '../services/desempena.service.js';
import { manejarError } from '../utils/errores.js';

// Los datos ya pasaron por el middleware: aquí solo convertimos a número
// El try/catch queda para los errores del service (404, 409, 500)

// id_dueno viene en el body (PUT) o en la query (?id_dueno=1), igual que en validarDueno
const obtenerIdDueno = (req) => Number(req.body?.id_dueno ?? req.query.id_dueno);

// GET /api/trabajadores/:id/roles?id_dueno=1
export const listarRolesDeTrabajador = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = await service.listarRolesDeTrabajador(id, obtenerIdDueno(req));
    res.json(data);
  } catch (error) {
    manejarError(res, error);
  }
};

// PUT /api/trabajadores/:id/roles   body: { id_dueno, roles }
export const asignarRoles = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { roles } = req.body; // ya viene limpio desde verificarSchemaDesempena
    const data = await service.asignarRoles(id, roles, obtenerIdDueno(req));
    res.json({ mensaje: 'Roles actualizados', ...data });
  } catch (error) {
    manejarError(res, error);
  }
};

// POST /api/trabajadores/:id/rol/:idRol?id_dueno=1
export const agregarRol = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const idRol = Number(req.params.idRol);
    const roles = await service.agregarRol(id, idRol, obtenerIdDueno(req));
    res.status(201).json({ mensaje: 'Rol asignado', roles });
  } catch (error) {
    manejarError(res, error);
  }
};

// DELETE /api/trabajadores/:id/rol/:idRol?id_dueno=1
export const quitarRol = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const idRol = Number(req.params.idRol);
    const roles = await service.quitarRol(id, idRol, obtenerIdDueno(req));
    res.json({ mensaje: 'Rol quitado', roles });
  } catch (error) {
    manejarError(res, error);
  }
};

// GET /api/rol/:idRol/trabajadores?id_dueno=1
export const listarTrabajadoresDeRol = async (req, res) => {
  try {
    const idRol = Number(req.params.idRol);
    const data = await service.listarTrabajadoresDeRol(idRol, obtenerIdDueno(req));
    res.json(data);
  } catch (error) {
    manejarError(res, error);
  }
};