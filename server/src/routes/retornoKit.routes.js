import { Router } from 'express';
import { obtenerKitsEnTerreno, registrarRetorno } from '../controllers/retornoKit.controller.js';
import { registrarRetornoMiddleware } from '../middlewares/retornoKit.middleware.js';

const router = Router();

router.get('/en-terreno', obtenerKitsEnTerreno);
router.post('/', registrarRetornoMiddleware, registrarRetorno);

export default router;