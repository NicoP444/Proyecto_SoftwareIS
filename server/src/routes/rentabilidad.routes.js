import { Router } from 'express';
import { validarId } from '../middlewares/validate.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';
import * as controller from '../controllers/rentabilidad.controller.js';

const router = Router();

// RF-P7-09 y RF-P7-12: Dueño y Contador
router.use(autenticar, permitirRoles('DUENO', 'CONTADOR'));

router.get('/mes', controller.porMes);
router.get('/evento/:id/movimientos', validarId, controller.movimientos);
router.get('/evento/:id', validarId, controller.ver);

export default router;