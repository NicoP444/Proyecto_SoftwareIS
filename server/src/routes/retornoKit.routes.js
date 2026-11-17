import { Router } from 'express';
import { obtenerKitsEnTerreno, registrarRetorno } from '../controllers/retornoKit.controller.js';
import { registrarRetornoMiddleware } from '../middlewares/retornoKit.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(autenticar, permitirRoles('JEFE_TECNICO', 'DUENO'));

router.get('/en-terreno', obtenerKitsEnTerreno);
router.post('/', registrarRetornoMiddleware, registrarRetorno);

export default router;