import { Router } from 'express';
import {
  marcarEventoRealizado,
  listarEventosConfirmados,
} from '../controllers/marcarEvento.controller.js';
import { marcarEventoRealizadoMiddleware } from '../middlewares/marcarEvento.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(autenticar, permitirRoles('DUENO'));

// Listar eventos confirmados listos para revisar/finalizar
router.get('/confirmados', listarEventosConfirmados);
// Marcar como realizado (
router.patch('/:id_evento/realizado', marcarEventoRealizadoMiddleware, marcarEventoRealizado);

export default router;