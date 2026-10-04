import { Router } from 'express';
import auspiciadorRoutes from './auspiciador.routes.js';
import incidenteRoutes from './incidente.routes.js';
import rolRoutes from './rol.routes.js';

const router = Router();

// Aquí le decimos al servidor que use tus rutas
router.use('/auspiciadores', auspiciadorRoutes);
router.use('/incidentes', incidenteRoutes);
router.use('/rol', rolRoutes);


export default router;