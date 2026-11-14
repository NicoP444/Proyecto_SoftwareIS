import { Router } from 'express';
import { obtenerResumenFinancieroMensual } from '../controllers/resumenMensual.controller.js';
import { verificarPeriodoCierre } from '../middlewares/gastosFijos.middleware.js';

const router = Router();

router.get('/', verificarPeriodoCierre, obtenerResumenFinancieroMensual);

export default router;