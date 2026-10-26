import { Router } from 'express';
import { 
  crearDisponibilidadMiddleware, 
  listarDisponibilidadMiddleware,
  actualizarDisponibilidadMiddleware,
  eliminarDisponibilidadMiddleware
} from '../middlewares/disponibilidad.middleware.js';

import { 
  crearDisponibilidad, 
  listarDisponibilidad,
  actualizarDisponibilidad,
  eliminarDisponibilidad
} from '../controllers/disponibilidad.controller.js';

const router = Router({ mergeParams: true });

router.post('/', crearDisponibilidadMiddleware, crearDisponibilidad);
router.get('/', listarDisponibilidadMiddleware, listarDisponibilidad);

router.put('/:id_d', actualizarDisponibilidadMiddleware, actualizarDisponibilidad);
router.delete('/:id_d', eliminarDisponibilidadMiddleware, eliminarDisponibilidad);

export default router;