import { Router } from 'express';
import { auspiciadorController } from '../controllers/auspiciador.controller.js';

const router = Router();

// GET /api/auspiciadores -> Obtiene la lista de auspiciadores
router.get('/', auspiciadorController.obtenerTodos);

// POST /api/auspiciadores -> Registra un nuevo auspiciador
router.post('/', auspiciadorController.crear);

// PUT /api/auspiciadores/:id -> Modifica un auspiciador existente
router.put('/:id', auspiciadorController.modificar);

// DELETE /api/auspiciadores/:id -> Elimina un auspiciador
router.delete('/:id', auspiciadorController.eliminar);

export default router;