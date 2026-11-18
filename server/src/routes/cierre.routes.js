import { Router } from 'express';
import { validarId, validarBody, validarDueno } from '../middlewares/validate.middleware.js';
import { autenticar, permitirRoles, idDesdeSesion } from '../middlewares/auth.middleware.js';
import * as controller from '../controllers/cierre.controller.js';

const router = Router();

router.get('/evento/:id', autenticar, permitirRoles('DUENO', 'CONTADOR'), validarId, controller.revisar);
// RF-P7-08: solo el Dueño cierra la jornada
router.post('/evento/:id', autenticar, permitirRoles('DUENO'), idDesdeSesion, validarId, validarBody, validarDueno, controller.cerrar);

export default router;