import { Router } from 'express';
import {
  obtenerDetalleCorreccionMes,
  corregirMontoMesCerrado,
} from '../controllers/corregirMesCerrado.controller.js';
import { verificarPeriodoCierre } from '../middlewares/gastosFijos.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(autenticar, permitirRoles('CONTADOR'));

router.get('/registros', verificarPeriodoCierre, obtenerDetalleCorreccionMes);
router.patch('/corregir', verificarPeriodoCierre, corregirMontoMesCerrado);

export default router;