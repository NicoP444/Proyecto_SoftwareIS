import { Router } from 'express';
import { validarId, validarBody, validarContador } from '../middlewares/validate.middleware.js';
import { autenticar, permitirRoles, idDesdeSesion } from '../middlewares/auth.middleware.js';
import * as controller from '../controllers/rendicion.controller.js';

const router = Router();

router.get('/evento/:id', autenticar, permitirRoles('DUENO', 'CONTADOR'), validarId, controller.listarPorEvento);
router.patch('/:id', autenticar, permitirRoles('CONTADOR'), idDesdeSesion, validarId, validarBody, validarContador, controller.marcar);

export default router;