import { Router } from 'express';
import { validarId } from '../middlewares/validate.middleware.js';
import * as controller from '../controllers/historialTrabajador.controller.js';

const router = Router();

// Eventos en que participó un trabajador (el :id es el id_trabajador)
router.get('/:id', validarId, controller.ver);

export default router;