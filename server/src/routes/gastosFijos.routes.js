import { Router } from 'express';
import {
  registrarGastoFijo,
  listarGastosFijos,
} from '../controllers/gastosFijos.controller.js';
import {
  subirEvidenciaGastoFijo,
  verificarCrearGastoFijo,
  verificarPeriodoCierre,
} from '../middlewares/gastosFijos.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(autenticar, permitirRoles('CONTADOR', 'DUENO'));

router.get('/', verificarPeriodoCierre, listarGastosFijos);
router.post('/', subirEvidenciaGastoFijo, verificarCrearGastoFijo, registrarGastoFijo);

export default router;