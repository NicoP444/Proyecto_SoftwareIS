import { Router } from 'express';
import { validarId, validarBody, validarContador, camposObligatorios } from '../middlewares/validate.middleware.js';
import { listar, registrar } from '../controllers/pagoCliente.controller.js';

const router = Router();

// RF-P1-09: pagos del cliente de un evento (con saldo pendiente)
router.get('/evento/:id', validarId, listar);

// RF-P1-09 + RF-P1-10: registrar un pago (solo el Contador)
router.post(
  '/evento/:id',
  validarId,
  validarBody,
  validarContador,
  camposObligatorios('tipo_pago', 'monto', 'fecha', 'medio_pago'),
  registrar,
);

export default router;