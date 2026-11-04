import { Router } from 'express';
import { validarId, validarBody, validarContador } from '../middlewares/validate.middleware.js';
import { subirEvidencia } from '../middlewares/gastoEvento.middleware.js';
import * as controller from '../controllers/gastoEvento.controller.js';

const router = Router();

// multer va PRIMERO: con multipart/form-data req.body no existe hasta que se procesa
router.post('/', subirEvidencia, validarBody, validarContador, controller.crear);
router.get('/evento/:id', validarId, controller.listarPorEvento);
router.put('/:id', validarId, subirEvidencia, validarBody, validarContador, controller.modificar);
router.delete('/:id', validarId, validarBody, validarContador, controller.eliminar);
export default router;