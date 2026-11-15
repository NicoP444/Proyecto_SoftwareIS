import { Router } from 'express';
import { kitController } from '../controllers/kit.controller.js';
import { crearKitMiddleware, actualizarKitMiddleware } from '../middlewares/kit.middleware.js';

const router = Router();

router.get('/', kitController.listar);
router.post('/', crearKitMiddleware, kitController.crear);
router.put('/:id', actualizarKitMiddleware, kitController.actualizar);
router.delete('/:id', kitController.eliminar);

export default router;