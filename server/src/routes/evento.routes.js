import { Router } from 'express';
import { getEventos, postEvento, deleteEvento, putEvento } from '../controllers/evento.controller.js';
import { validarId, camposObligatorios } from '../middlewares/validate.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Ver la agenda: cualquier usuario con sesión. Crear, modificar y eliminar: solo el Dueño.
router.get('/', autenticar, getEventos);
router.post(
  '/',
  autenticar,
  permitirRoles('DUENO'),
  camposObligatorios('tipo', 'fecha', 'hora_inicio', 'hora_termino', 'direccion', 'precio_acordado', 'id_cliente'),
  postEvento
);
router.put(
  '/:id',
  autenticar,
  permitirRoles('DUENO'),
  validarId,
  camposObligatorios('tipo', 'fecha', 'hora_inicio', 'hora_termino', 'direccion', 'cantidad_camaras', 'precio_acordado', 'id_cliente'),
  putEvento
);
router.delete('/:id', autenticar, permitirRoles('DUENO'), validarId, camposObligatorios('motivo'), deleteEvento);

export default router;