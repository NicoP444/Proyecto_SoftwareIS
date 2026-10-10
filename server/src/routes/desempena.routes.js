import { Router } from 'express';
import * as ctrl from '../controllers/desempena.controller.js';
import {
  validarListarRolesTrabajador,
  validarAsignarRoles,
  validarTrabajadorRol,
  validarListarTrabajadoresRol,
} from '../middlewares/desempena.middleware.js';

const router = Router();

router.get('/trabajadores/:id/roles', validarListarRolesTrabajador, ctrl.listarRolesDeTrabajador);
router.put('/trabajadores/:id/roles', validarAsignarRoles, ctrl.asignarRoles);
router.post('/trabajadores/:id/rol/:idRol', validarTrabajadorRol, ctrl.agregarRol);
router.delete('/trabajadores/:id/rol/:idRol', validarTrabajadorRol, ctrl.quitarRol);
router.get('/rol/:idRol/trabajadores', validarListarTrabajadoresRol, ctrl.listarTrabajadoresDeRol);

export default router;