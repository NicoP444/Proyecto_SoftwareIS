import { Router } from 'express';
import { validarId, validarBody, validarContador, camposObligatorios } from '../middlewares/validate.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';
import { listar, registrar } from '../controllers/pagoCliente.controller.js';

const router = Router();

// El id del contador sale del token y no del body: nadie puede registrar pagos a nombre de otro
const contadorDeSesion = (req, res, next) => {
  req.body.id_contador = req.user.id_contador;
  next();
};

// RF-P1-09: pagos del cliente de un evento (con saldo pendiente): Dueño y Contador
router.get('/evento/:id', autenticar, permitirRoles('DUENO', 'CONTADOR'), validarId, listar);

// RF-P1-09 + RF-P1-10: registrar un pago (solo el Contador)
router.post(
  '/evento/:id',
  autenticar,
  permitirRoles('CONTADOR'),
  validarId,
  validarBody,
  contadorDeSesion,
  validarContador,
  camposObligatorios('tipo_pago', 'monto', 'fecha', 'medio_pago'),
  registrar,
);

export default router;