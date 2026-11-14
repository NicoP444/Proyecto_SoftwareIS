import { Router } from 'express';
import { validarPreCierreMes, cerrarMesContable } from '../controllers/cierreMes.controller.js';
import { verificarPeriodoCierre } from '../middlewares/gastosFijos.middleware.js';

const router = Router();

router.get('/validar', verificarPeriodoCierre, validarPreCierreMes);
router.post('/cerrar', verificarPeriodoCierre, cerrarMesContable);

export default router;