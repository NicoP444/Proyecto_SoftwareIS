import { Router } from 'express';
import { getMargenTraslado, putMargenTraslado } from '../controllers/configuracion.controller.js';
import { validarBody, camposObligatorios, validarDueno } from '../middlewares/validate.middleware.js';

const router = Router();

// RF-P3-02: margen de traslado entre eventos en lugares distintos
router.get('/margen-traslado', validarDueno, getMargenTraslado);
router.put('/margen-traslado', validarBody, camposObligatorios('margen_traslado_min'), validarDueno, putMargenTraslado);

export default router;