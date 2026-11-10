import { Router } from 'express';
import {
  getPersonalDisponible,
  getAsignaciones,
  postAsignacion,
  deleteAsignacion,
} from '../controllers/asignacion.controller.js';
import { validarId, validarBody, camposObligatorios, validarDueno } from '../middlewares/validate.middleware.js';

const router = Router();

// RF-P1-03: quién está libre para una fecha y horario (solo consulta)
router.get('/personal-disponible', validarDueno, getPersonalDisponible);

// RF-P3-01: dotación de un evento
router.get('/eventos/:id/asignaciones', validarId, getAsignaciones);
router.post(
  '/eventos/:id/asignaciones',
  validarId,
  validarBody,
  camposObligatorios('id_trabajador', 'id_rol'),
  validarDueno,
  postAsignacion,
);
router.delete('/eventos/:id/asignaciones/:id_asignacion', validarId, deleteAsignacion);

export default router;