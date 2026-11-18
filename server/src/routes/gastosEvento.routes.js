import { Router } from 'express';
import { validarId, validarBody, validarContador } from '../middlewares/validate.middleware.js';
import { subirEvidencia } from '../middlewares/gastoEvento.middleware.js';
import { autenticar, permitirRoles, idDesdeSesion } from '../middlewares/auth.middleware.js';
import * as controller from '../controllers/gastoEvento.controller.js';

const router = Router();
const contador = [autenticar, permitirRoles('CONTADOR')];

// multer va antes de idDesdeSesion: con multipart/form-data multer reemplaza req.body
router.post('/', contador, subirEvidencia, idDesdeSesion, validarBody, validarContador, controller.crear);
router.get('/evento/:id', autenticar, permitirRoles('DUENO', 'CONTADOR'), validarId, controller.listarPorEvento);
router.put('/:id', contador, validarId, subirEvidencia, idDesdeSesion, validarBody, validarContador, controller.modificar);
router.delete('/:id', contador, idDesdeSesion, validarId, validarBody, validarContador, controller.eliminar);

export default router;