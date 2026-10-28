import { Router } from 'express';
import { 
  crearDisponibilidadMiddleware, 
  listarDisponibilidadMiddleware,
  actualizarDisponibilidadMiddleware
} from '../middlewares/disponibilidad.middleware.js';
import { 
  crearDisponibilidad, 
  listarDisponibilidad,
  actualizarDisponibilidad
} from '../controllers/disponibilidad.controller.js';

const router = Router({ mergeParams: true });

router.post('/', crearDisponibilidadMiddleware, crearDisponibilidad);
router.get('/', listarDisponibilidadMiddleware, listarDisponibilidad);
router.put('/:nro_bloque', actualizarDisponibilidadMiddleware, actualizarDisponibilidad);

export default router;