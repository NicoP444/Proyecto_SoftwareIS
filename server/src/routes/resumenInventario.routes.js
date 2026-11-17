import { Router } from 'express';
import { obtenerResumenInventario } from '../controllers/resumenInventario.controller.js';
import { verificarPeriodoCierre } from '../middlewares/gastosFijos.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(autenticar, permitirRoles('DUENO', 'CONTADOR'));

router.get('/', verificarPeriodoCierre, obtenerResumenInventario);

export default router;