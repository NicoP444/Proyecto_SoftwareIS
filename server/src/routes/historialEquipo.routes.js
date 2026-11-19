import { Router } from 'express';
import { obtenerHistorialEquipo } from '../controllers/historialEquipo.controller.js';
import { historialEquipoMiddleware } from '../middlewares/historialEquipo.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';
const router = Router();

router.use(autenticar, permitirRoles('JEFE_TECNICO', 'DUENO'));

// Endpoint para consultar trazabilidad del equipo
router.get('/:codigo', historialEquipoMiddleware, obtenerHistorialEquipo);

export default router;