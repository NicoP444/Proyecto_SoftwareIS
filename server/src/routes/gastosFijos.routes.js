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

const router = Router();

router.get('/', verificarPeriodoCierre, listarGastosFijos);
router.post('/', subirEvidenciaGastoFijo, verificarCrearGastoFijo, registrarGastoFijo);

export default router;