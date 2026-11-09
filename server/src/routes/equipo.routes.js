import { Router } from 'express';
import * as equipoController from '../controllers/equipo.controller.js';

const router = Router();

router.get('/', equipoController.obtenerEquipos);
router.post('/', equipoController.crearEquipo);
router.put('/:codigo', equipoController.modificarEquipo);
router.patch('/:codigo/baja', equipoController.darDeBajaEquipo);
router.delete('/:codigo', equipoController.eliminarEquipo);


export default router;