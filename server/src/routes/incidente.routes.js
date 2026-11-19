import { Router } from 'express';
import {
  registrarIncidente,
  listarIncidentes,
  obtenerIncidentesPorEvento,
} from '../controllers/incidente.controller.js';
import {
  crearIncidenteMiddleware,
  listarIncidentesEventoMiddleware,
} from '../middlewares/incidente.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(autenticar);

router.get('/', permitirRoles('JEFE_TECNICO', 'DUENO', 'CONTADOR'), listarIncidentes);
router.post('/', permitirRoles('JEFE_TECNICO'), crearIncidenteMiddleware, registrarIncidente);
router.get('/evento/:id_evento', permitirRoles('DUENO', 'CONTADOR'), listarIncidentesEventoMiddleware, obtenerIncidentesPorEvento);

export default router;