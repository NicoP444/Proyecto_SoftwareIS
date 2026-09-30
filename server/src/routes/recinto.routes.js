import { Router } from 'express';
import { getRecintos, postRecinto } from '../controllers/recinto.controller.js';
import { camposObligatorios } from '../middlewares/validate.middleware.js';

const router = Router();
router.get('/', getRecintos);
router.post('/', camposObligatorios('nombre', 'comuna'), postRecinto);

export default router;