import { Router } from 'express';
import * as ctrl from '../controllers/desempena.controller.js';
import {
  validarListarRolesTrabajador,
  validarAsignarRoles,
  validarTrabajadorRol,
  validarListarTrabajadoresRol,
} from '../middlewares/desempena.middleware.js';
import { autenticar, permitirRoles, idDesdeSesion } from '../middlewares/auth.middleware.js';

const router = Router();
const soloDueno = [autenticar, permitirRoles('DUENO'), idDesdeSesion];

router.get('/trabajadores/:id/roles', soloDueno, validarListarRolesTrabajador, ctrl.listarRolesDeTrabajador);
router.put('/trabajadores/:id/roles', soloDueno, validarAsignarRoles, ctrl.asignarRoles);
router.post('/trabajadores/:id/rol/:idRol', soloDueno, validarTrabajadorRol, ctrl.agregarRol);
router.delete('/trabajadores/:id/rol/:idRol', soloDueno, validarTrabajadorRol, ctrl.quitarRol);
router.get('/rol/:idRol/trabajadores', soloDueno, validarListarTrabajadoresRol, ctrl.listarTrabajadoresDeRol);

export default router;