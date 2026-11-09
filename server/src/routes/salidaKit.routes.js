import { Router } from 'express';
import { 
  obtenerEventosConReservas, 
  obtenerKitsPorEvento, 
  registrarSalidaKit 
} from '../controllers/salidaKit.controller.js';

const router = Router();

// Ruta propia para listar eventos con kits listos
router.get('/eventos', obtenerEventosConReservas);

// Las otras rutas de tu módulo
router.get('/evento/:id_evento', obtenerKitsPorEvento);
router.post('/', registrarSalidaKit);

export default router;