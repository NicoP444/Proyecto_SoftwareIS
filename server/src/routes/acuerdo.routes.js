import { Router } from 'express';
import * as acuerdoController from '../controllers/acuerdo.controller.js';

const router = Router();

// Rutas
router.get('/', acuerdoController.obtenerAcuerdos);
router.post('/', acuerdoController.crearAcuerdo);

export default router;