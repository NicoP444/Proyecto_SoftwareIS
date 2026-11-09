import { Router } from 'express';
import { validarId, validarBody, validarDueno } from '../middlewares/validate.middleware.js';
import * as controller from '../controllers/remuneracion.controller.js';

const router = Router();

// Porcentaje y monto de cada trabajador del evento, y lo que queda para la empresa
router.get('/evento/:id', validarId, controller.listarPorEvento);

// RF-P7-05: definir el porcentaje de un trabajador (el :id es el id_asignacion)
router.put('/:id', validarId, validarBody, validarDueno, controller.definirPorcentaje);

export default router;