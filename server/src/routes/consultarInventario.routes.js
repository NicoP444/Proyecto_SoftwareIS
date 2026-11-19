import { Router } from 'express';
import { getInventario } from '../controllers/consultarInventario.controller.js';
import { consultarInventarioMiddleware } from '../middlewares/consultarInventario.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(autenticar, permitirRoles('JEFE_TECNICO', 'DUENO', 'CONTADOR'));

router.get('/', consultarInventarioMiddleware, getInventario);

export default router;