import { Router } from 'express';
import { validarPreCierreMes, cerrarMesContable } from '../controllers/cierreMes.controller.js';
import { verificarPeriodoCierre } from '../middlewares/gastosFijos.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(autenticar, permitirRoles('CONTADOR'));

router.get('/validar', verificarPeriodoCierre, validarPreCierreMes);
router.post('/cerrar', verificarPeriodoCierre, cerrarMesContable);

export default router;