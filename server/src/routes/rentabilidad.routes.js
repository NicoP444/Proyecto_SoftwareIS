import { Router } from 'express';
import { validarId } from '../middlewares/validate.middleware.js';
import * as controller from '../controllers/rentabilidad.controller.js';

const router = Router();

// Rentabilidad del evento: al día, o definitiva si la jornada está cerrada
router.get('/evento/:id', validarId, controller.ver);

export default router;