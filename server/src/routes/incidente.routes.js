import { Router } from 'express';
import { registrarIncidente, listarIncidentes } from '../controllers/incidente.controller.js';

const router = Router();

router.get('/', listarIncidentes);
router.post('/', registrarIncidente);

export default router;