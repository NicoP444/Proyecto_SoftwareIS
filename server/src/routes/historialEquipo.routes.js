import { Router } from 'express';
import { obtenerHistorialEquipo } from '../controllers/historialEquipo.controller.js';

const router = Router();

// Endpoint para consultar trazabilidad del equipo
router.get('/:codigo', obtenerHistorialEquipo);

export default router;