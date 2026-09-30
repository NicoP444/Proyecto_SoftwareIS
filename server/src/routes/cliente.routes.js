import { Router } from 'express';
import { getClientes, postCliente } from '../controllers/cliente.controller.js';
import { camposObligatorios } from '../middlewares/validate.middleware.js';

const router = Router();
router.get('/', getClientes);
router.post('/', camposObligatorios('nombre', 'telefono'), postCliente);

export default router;