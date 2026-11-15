import { Router } from 'express';
import {
  getKitsEvento,
  getKitsDisponibles,
  postKitEvento,
  deleteKitEvento,
} from '../controllers/kitEvento.controller.js';
import { validarId, validarBody, camposObligatorios, validarDueno } from '../middlewares/validate.middleware.js';

const router = Router();

// RF-P1-05: kits de un evento (completos y libres en su horario)
router.get('/eventos/:id/kits', validarId, getKitsEvento);
router.get('/eventos/:id/kits-disponibles', validarId, validarDueno, getKitsDisponibles);
router.post('/eventos/:id/kits', validarId, validarBody, camposObligatorios('id_kit'), validarDueno, postKitEvento);
router.delete('/eventos/:id/kits/:id_reserva', validarId, deleteKitEvento);

export default router;