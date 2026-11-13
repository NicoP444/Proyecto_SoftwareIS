import { Router } from 'express';
import { obtenerHistorialEquipo } from '../controllers/historialEquipo.controller.js';
import { historialEquipoMiddleware } from '../middlewares/historialEquipo.middleware.js';

const router = Router();

// Endpoint para consultar trazabilidad del equipo
router.get('/:codigo', historialEquipoMiddleware, obtenerHistorialEquipo);

export default router;