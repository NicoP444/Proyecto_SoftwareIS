import { Router } from 'express';
import { 
  crearDisponibilidadMiddleware, 
  listarDisponibilidadMiddleware,
  actualizarDisponibilidadMiddleware,
  eliminarDisponibilidadMiddleware // Importar
} from '../middlewares/disponibilidad.middleware.js';
import { 
  crearDisponibilidad, 
  listarDisponibilidad,
  actualizarDisponibilidad,
  eliminarDisponibilidad // Importar
} from '../controllers/disponibilidad.controller.js';

const router = Router({ mergeParams: true });

router.post('/', crearDisponibilidadMiddleware, crearDisponibilidad);
router.get('/', listarDisponibilidadMiddleware, listarDisponibilidad);
router.put('/:nro_bloque', actualizarDisponibilidadMiddleware, actualizarDisponibilidad);
// Agregar la ruta de eliminación
router.delete('/:nro_bloque', eliminarDisponibilidadMiddleware, eliminarDisponibilidad);

export default router;