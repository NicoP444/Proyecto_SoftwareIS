import { Router } from 'express';
import * as acuerdoController from '../controllers/acuerdo.controller.js';

const router = Router();

// Rutas
router.get('/', acuerdoController.obtenerAcuerdos);
router.post('/', acuerdoController.crearAcuerdo);
router.put('/:id/cumplimiento', acuerdoController.registrarCumplimiento);
router.patch('/:id/incobrable', acuerdoController.declararIncobrable);

// Rutas para modificar y eliminar acuerdo
router.put('/:id', acuerdoController.modificarAcuerdo);
router.delete('/:id', acuerdoController.eliminarAcuerdo);

export default router;