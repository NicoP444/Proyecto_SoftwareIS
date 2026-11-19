import { Router } from 'express';
import {
  registrarGastoFijo,
  listarGastosFijos,
  actualizarGastoFijo,
  eliminarGastoFijo,
} from '../controllers/gastosFijos.controller.js';
import {
  subirEvidenciaGastoFijo,
  verificarCrearGastoFijo,
  verificarActualizarGastoFijo,
  verificarPeriodoCierre,
} from '../middlewares/gastosFijos.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(autenticar, permitirRoles('CONTADOR'));

router.get('/', verificarPeriodoCierre, listarGastosFijos);
router.post('/', subirEvidenciaGastoFijo, verificarCrearGastoFijo, registrarGastoFijo);
router.put('/:id', subirEvidenciaGastoFijo, verificarActualizarGastoFijo, actualizarGastoFijo);
router.delete('/:id', eliminarGastoFijo);

export default router;