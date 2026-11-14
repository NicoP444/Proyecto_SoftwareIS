import { Router } from 'express';
import { kitController } from '../controllers/kit.controller.js';
import { crearKitMiddleware } from '../middlewares/kit.middleware.js';

const router = Router();

router.post('/', crearKitMiddleware, kitController.crear);

export default router;