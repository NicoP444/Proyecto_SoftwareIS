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

const router = Router();

router.get('/', listarIncidentes);
router.post('/', crearIncidenteMiddleware, registrarIncidente);
router.get('/evento/:id_evento', listarIncidentesEventoMiddleware, obtenerIncidentesPorEvento);

export default router;