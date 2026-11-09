import { Router } from 'express';
import { registrarIncidente, 
        listarIncidentes,
        obtenerIncidentesPorEvento } from '../controllers/incidente.controller.js';

const router = Router();

router.get('/', listarIncidentes);
router.post('/', registrarIncidente);
router.get('/evento/:id_evento', obtenerIncidentesPorEvento);

export default router;