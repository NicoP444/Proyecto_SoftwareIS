import { Router } from 'express';
import { validarId, validarBody, validarContador } from '../middlewares/validate.middleware.js';
import * as controller from '../controllers/pagoRemuneracion.controller.js';

const router = Router();

// Cada trabajador del evento con su remuneración y su estado de pago
router.get('/evento/:id', validarId, controller.listarPorEvento);

// RF-P7-10: registrar el pago de un trabajador (el :id es el id_asignacion)
router.post('/:id', validarId, validarBody, validarContador, controller.registrar);

export default router;