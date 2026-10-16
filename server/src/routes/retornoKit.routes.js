import { Router } from 'express';
import { obtenerKitsEnTerreno, registrarRetorno } from '../controllers/retornoKit.controller.js';

const router = Router();

router.get('/en-terreno', obtenerKitsEnTerreno);
router.post('/', registrarRetorno);

export default router;