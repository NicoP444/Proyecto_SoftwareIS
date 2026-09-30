import { Router } from 'express';
import { ListarTrabajadores, RegistrarTrabajador, ActualizarTrabajador } from '../controllers/trabajador.controllers.js';
import { validarCrearTrabajador, validarActualizarTrabajador } from '../middlewares/trabajador.middleware.js';
import { validarDueno } from '../middlewares/validate.middleware.js';

const router = Router(); // primero se crea...

// ...y después se usa
router.get('/', validarDueno, ListarTrabajadores);
router.post('/', validarCrearTrabajador, RegistrarTrabajador);
router.put('/:id', validarActualizarTrabajador, ActualizarTrabajador);

export default router;