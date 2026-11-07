import { Router } from 'express';
import { validarId, validarBody, validarContador } from '../middlewares/validate.middleware.js';
import * as controller from '../controllers/rendicion.controller.js';

const router = Router();

// Panel: trabajadores del evento con su estado de rendición y cuántas faltan
router.get('/evento/:id', validarId, controller.listarPorEvento);

// Marcar una rendición (el :id es el id_asignacion)
router.patch('/:id', validarId, validarBody, validarContador, controller.marcar);

export default router;