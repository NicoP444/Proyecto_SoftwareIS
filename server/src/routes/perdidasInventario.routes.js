import { Router } from 'express';
import { listarPerdidasInventario } from '../controllers/perdidasInventario.controller.js';
import { verificarPeriodoCierre } from '../middlewares/gastosFijos.middleware.js';

const router = Router();

router.get('/', verificarPeriodoCierre, listarPerdidasInventario);

export default router;