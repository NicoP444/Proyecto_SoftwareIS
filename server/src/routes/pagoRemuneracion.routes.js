import { Router } from 'express';
import { validarId, validarBody, validarContador } from '../middlewares/validate.middleware.js';
import { autenticar, permitirRoles, idDesdeSesion } from '../middlewares/auth.middleware.js';
import * as controller from '../controllers/pagoRemuneracion.controller.js';

const router = Router();

router.get('/evento/:id', autenticar, permitirRoles('DUENO', 'CONTADOR'), validarId, controller.listarPorEvento);
// RF-P7-10: solo el Contador registra pagos
router.post('/:id', autenticar, permitirRoles('CONTADOR'), idDesdeSesion, validarId, validarBody, validarContador, controller.registrar);

export default router;