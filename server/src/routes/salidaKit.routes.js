import { Router } from 'express';
import { obtenerEventosConReservas, obtenerKitsPorEvento, registrarSalidaKit,} from '../controllers/salidaKit.controller.js';
import { registrarSalidaKitMiddleware, listarKitsEventoSalidaMiddleware, } from '../middlewares/salidaKit.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(autenticar, permitirRoles('JEFE_TECNICO'));

// Ruta propia para listar eventos con kits listos
router.get('/eventos', obtenerEventosConReservas);
router.get('/evento/:id_evento', listarKitsEventoSalidaMiddleware, obtenerKitsPorEvento);
router.post('/', registrarSalidaKitMiddleware, registrarSalidaKit);

export default router;