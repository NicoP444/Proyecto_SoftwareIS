import { Router } from 'express';
import { validarId, validarBody, camposObligatorios } from '../middlewares/validate.middleware.js';
import { ver, guardarGastos } from '../controllers/viabilidad.controller.js';

const router = Router();

// RF-P1-06: resultado estimado del evento y gastos estimados
router.get('/evento/:id', validarId, ver);
router.put('/evento/:id', validarId, validarBody, camposObligatorios('gastos_estimados'), guardarGastos);

export default router;