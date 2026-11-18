import { Router } from 'express';
import { validarId } from '../middlewares/validate.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';
import * as controller from '../controllers/historialTrabajador.controller.js';

const router = Router();

// RF-P7-11: Dueño y Contador
router.get('/:id', autenticar, permitirRoles('DUENO', 'CONTADOR'), validarId, controller.ver);

export default router;