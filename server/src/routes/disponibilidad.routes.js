import { Router } from 'express';
import {
  crearDisponibilidadMiddleware,
  listarDisponibilidadMiddleware,
  actualizarDisponibilidadMiddleware,
  eliminarDisponibilidadMiddleware,
} from '../middlewares/disponibilidad.middleware.js';
import {
  crearDisponibilidad,
  listarDisponibilidad,
  actualizarDisponibilidad,
  eliminarDisponibilidad,
} from '../controllers/disponibilidad.controller.js';
import { autenticar, permitirRoles, idDesdeSesion } from '../middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

// Todo lo de disponibilidad es solo del Dueño
router.use(autenticar, permitirRoles('DUENO'), idDesdeSesion);

router.post('/', crearDisponibilidadMiddleware, crearDisponibilidad);
router.get('/', listarDisponibilidadMiddleware, listarDisponibilidad);
router.put('/:nro_bloque', actualizarDisponibilidadMiddleware, actualizarDisponibilidad);
router.delete('/:nro_bloque', eliminarDisponibilidadMiddleware, eliminarDisponibilidad);

export default router;