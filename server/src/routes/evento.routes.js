import { Router } from 'express';
import { getEventos, postEvento, deleteEvento, putEvento } from '../controllers/evento.controller.js';
import { validarId, camposObligatorios } from '../middlewares/validate.middleware.js';

const router = Router();
router.get('/', getEventos);
router.post(
  '/',
  camposObligatorios('tipo', 'fecha', 'hora_inicio', 'hora_termino', 'direccion', 'cantidad_camaras', 'precio_acordado', 'id_cliente'),
  postEvento
);
router.put(
  '/:id',
  validarId,
  camposObligatorios('tipo', 'fecha', 'hora_inicio', 'hora_termino', 'direccion', 'cantidad_camaras', 'precio_acordado', 'id_cliente'),
  putEvento
);
router.delete('/:id', validarId, deleteEvento);

export default router;