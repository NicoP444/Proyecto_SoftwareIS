import { Router } from 'express';
import { auspiciadorController } from '../controllers/auspiciador.controller.js';
import { auspiciadorSchema } from '../schemas/auspiciador.schema.js';
import { validarCampos, validarId } from '../middlewares/validate.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas exigen sesión iniciada
router.use(autenticar);

// Ver auspiciadores: Dueño y Contador 
router.get('/', permitirRoles('DUENO', 'CONTADOR'), auspiciadorController.obtenerTodos);

// Registrar, modificar/clasificar y eliminar: solo Dueño 
router.post('/', permitirRoles('DUENO'), auspiciadorSchema, validarCampos, auspiciadorController.crear);
router.put('/:id', permitirRoles('DUENO'), validarId, auspiciadorSchema, validarCampos, auspiciadorController.modificar);
router.delete('/:id', permitirRoles('DUENO'), validarId, auspiciadorController.eliminar);

export default router;