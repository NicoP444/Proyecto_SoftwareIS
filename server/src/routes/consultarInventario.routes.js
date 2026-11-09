import { Router } from 'express';
import { getInventario } from '../controllers/consultarInventario.controller.js';

const router = Router();

router.get('/', getInventario);

export default router;