import { Router } from 'express';
import { auspiciadorController } from '../controllers/auspiciador.controller.js';

const router = Router();

// Definimos qué URLs están disponibles y a qué función del "mesero" llaman
// POST /api/auspiciadores -> Registra un nuevo auspiciador
router.post('/', auspiciadorController.crear);

// PUT /api/auspiciadores/:id -> Modifica un auspiciador existente
router.put('/:id', auspiciadorController.modificar);

// DELETE /api/auspiciadores/:id -> Elimina un auspiciador (si no tiene acuerdos)
router.delete('/:id', auspiciadorController.eliminar);

export default router;