import { Router } from 'express';
import { listarPerdidasInventario } from '../controllers/perdidasInventario.controller.js';
import { verificarPeriodoCierre } from '../middlewares/gastosFijos.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(autenticar, permitirRoles('DUENO', 'CONTADOR', 'JEFE_TECNICO'));

router.get('/', verificarPeriodoCierre, listarPerdidasInventario);

export default router;