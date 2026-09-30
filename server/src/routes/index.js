import { Router } from 'express';
import auspiciadorRoutes from './auspiciador.routes.js';
import incidenteRoutes from './incidente.routes.js';

const router = Router();

// Aquí le decimos al servidor que use tus rutas
router.use('/auspiciadores', auspiciadorRoutes);
router.use('/incidentes', incidenteRoutes);

export default router;