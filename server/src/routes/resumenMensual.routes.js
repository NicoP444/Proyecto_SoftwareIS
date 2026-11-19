import { Router } from 'express';
import { obtenerResumenFinancieroMensual } from '../controllers/resumenMensual.controller.js';
import { verificarPeriodoCierre } from '../middlewares/gastosFijos.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(autenticar, permitirRoles('CONTADOR', 'DUENO'));

router.get('/', verificarPeriodoCierre, obtenerResumenFinancieroMensual);

export default router;