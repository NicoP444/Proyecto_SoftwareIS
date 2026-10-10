import { Router } from 'express';
import auspiciadorRoutes from './auspiciador.routes.js';
import incidenteRoutes from './incidente.routes.js';
import rolRoutes from './rol.routes.js';
import trabajadorRoutes from './trabajador.routes.js';
import desempenaRoutes from './desempena.routes.js';

const router = Router();

// Aquí le decimos al servidor que use tus rutas
router.use('/auspiciadores', auspiciadorRoutes);
router.use('/incidentes', incidenteRoutes);
router.use('/rol', rolRoutes);
router.use('/trabajadores',trabajadorRoutes);
router.use('/', desempenaRoutes);


export default router;