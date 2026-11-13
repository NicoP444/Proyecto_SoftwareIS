import { Router } from 'express';
import {
  marcarEventoRealizado,
  listarEventosConfirmados,
} from '../controllers/marcarEvento.controller.js';
import { marcarEventoRealizadoMiddleware } from '../middlewares/marcarEvento.middleware.js';

const router = Router();

// Listar eventos confirmados listos para revisar/finalizar
router.get('/confirmados', listarEventosConfirmados);

// Marcar como realizado (RF-P7-01)
router.patch('/:id_evento/realizado', marcarEventoRealizadoMiddleware, marcarEventoRealizado);

export default router;