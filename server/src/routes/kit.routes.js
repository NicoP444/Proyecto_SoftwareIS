import { Router } from 'express';
import { kitController } from '../controllers/kit.controller.js';
import { crearKitMiddleware, actualizarKitMiddleware } from '../middlewares/kit.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Gestión de kits: solo Jefe de área técnica 
router.use(autenticar, permitirRoles('JEFE_TECNICO'));

router.get('/', kitController.listar);
router.post('/', crearKitMiddleware, kitController.crear);
router.put('/:id', actualizarKitMiddleware, kitController.actualizar);
router.delete('/:id', kitController.eliminar);

export default router;