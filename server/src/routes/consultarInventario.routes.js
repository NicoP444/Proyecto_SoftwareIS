import { Router } from 'express';
import { getInventario } from '../controllers/consultarInventario.controller.js';
import { consultarInventarioMiddleware } from '../middlewares/consultarInventario.middleware.js';

const router = Router();

router.get('/', consultarInventarioMiddleware, getInventario);

export default router;