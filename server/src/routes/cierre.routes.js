import { Router } from 'express';
import { validarId, validarBody, validarDueno } from '../middlewares/validate.middleware.js';
import * as controller from '../controllers/cierre.controller.js';

const router = Router();

// Revisión previa: qué falta, advertencias y resultado actual
router.get('/evento/:id', validarId, controller.revisar);

// Cerrar la jornada (solo el Dueño)
router.post('/evento/:id', validarId, validarBody, validarDueno, controller.cerrar);

export default router;