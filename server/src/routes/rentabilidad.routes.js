import { Router } from 'express';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';
import { validarId } from '../middlewares/validate.middleware.js';
import * as controller from '../controllers/rentabilidad.controller.js';

const router = Router();

router.use(autenticar, permitirRoles('DUENO', 'CONTADOR'));
// RF-P7-12: eventos de un mes con sus ingresos, costos y resultado
router.get('/mes', controller.porMes);

// RF-P7-12: detalle de movimientos de un evento
router.get('/evento/:id/movimientos', validarId, controller.movimientos);

// RF-P7-09: rentabilidad de un evento, al día o definitiva si la jornada está cerrada
router.get('/evento/:id', validarId, controller.ver);

export default router;