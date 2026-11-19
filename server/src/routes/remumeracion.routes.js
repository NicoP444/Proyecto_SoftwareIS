import { Router } from 'express';
import { validarId, validarBody, validarDueno } from '../middlewares/validate.middleware.js';
import { autenticar, permitirRoles, idDesdeSesion } from '../middlewares/auth.middleware.js';
import * as controller from '../controllers/remuneracion.controller.js';

const router = Router();

router.get('/evento/:id', autenticar, permitirRoles('DUENO', 'CONTADOR'), validarId, controller.listarPorEvento);
// RF-P7-05: solo el Dueño define porcentajes
router.put('/:id', autenticar, permitirRoles('DUENO'), idDesdeSesion, validarId, validarBody, validarDueno, controller.definirPorcentaje);

export default router;