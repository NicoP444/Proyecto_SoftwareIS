import { Router } from 'express';
import { validarId, validarBody, camposObligatorios } from '../middlewares/validate.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';
import { ver, guardarGastos } from '../controllers/viabilidad.controller.js';

const router = Router();

// RF-P1-06: resultado estimado del evento (Dueño y Contador) y gastos estimados (solo el Dueño)
router.get('/evento/:id', autenticar, permitirRoles('DUENO', 'CONTADOR'), validarId, ver);
router.put('/evento/:id', autenticar, permitirRoles('DUENO'), validarId, validarBody, camposObligatorios('gastos_estimados'), guardarGastos);

export default router;