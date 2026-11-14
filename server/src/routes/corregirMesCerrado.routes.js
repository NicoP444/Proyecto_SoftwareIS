import { Router } from 'express';
import {
  obtenerDetalleCorreccionMes,
  corregirMontoMesCerrado,
} from '../controllers/corregirMesCerrado.controller.js';
import { verificarPeriodoCierre } from '../middlewares/gastosFijos.middleware.js';

const router = Router();

router.get('/registros', verificarPeriodoCierre, obtenerDetalleCorreccionMes);
router.patch('/corregir', verificarPeriodoCierre, corregirMontoMesCerrado);

export default router;