import { Router } from 'express';
import { crearDisponibilidadMiddleware, listarDisponibilidadMiddleware } from '../middlewares/disponibilidad.middleware.js';
import { crearDisponibilidad, listarDisponibilidad } from '../controllers/disponibilidad.controller.js';

const router = Router({ mergeParams: true });

router.post('/', crearDisponibilidadMiddleware, crearDisponibilidad);
router.get('/', listarDisponibilidadMiddleware, listarDisponibilidad);

export default router;