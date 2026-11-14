import { Router } from 'express';
import { obtenerResumenInventario } from '../controllers/resumenInventario.controller.js';
import { verificarPeriodoCierre } from '../middlewares/gastosFijos.middleware.js';

const router = Router();

router.get('/', verificarPeriodoCierre, obtenerResumenInventario);

export default router;