import { Router } from 'express';
import {
  getKitsEvento,
  getKitsDisponibles,
  postKitEvento,
  deleteKitEvento,
} from '../controllers/kitEvento.controller.js';
import { validarId, validarBody, camposObligatorios, validarDueno } from '../middlewares/validate.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// RF-P1-05: kits de un evento. Verlos: cualquier usuario con sesión. Asignarlos o quitarlos: solo el Dueño.
router.get('/eventos/:id/kits', autenticar, validarId, getKitsEvento);
router.get('/eventos/:id/kits-disponibles', autenticar, permitirRoles('DUENO'), validarId, validarDueno, getKitsDisponibles);
router.post('/eventos/:id/kits', autenticar, permitirRoles('DUENO'), validarId, validarBody, camposObligatorios('id_kit'), validarDueno, postKitEvento);
router.delete('/eventos/:id/kits/:id_reserva', autenticar, permitirRoles('DUENO'), validarId, deleteKitEvento);

export default router;