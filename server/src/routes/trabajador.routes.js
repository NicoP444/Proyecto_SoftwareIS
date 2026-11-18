import { Router } from 'express';
import { ListarTrabajadores, RegistrarTrabajador, ActualizarTrabajador } from '../controllers/trabajador.controllers.js';
import { validarCrearTrabajador, validarActualizarTrabajador } from '../middlewares/trabajador.middleware.js';
import { autenticar, permitirRoles, idDesdeSesion } from '../middlewares/auth.middleware.js';

const router = Router();
const soloDueno = [autenticar, permitirRoles('DUENO'), idDesdeSesion];

// Listar: cualquier usuario con sesión (la página de Incidentes también lo usa)
router.get('/', autenticar, ListarTrabajadores);
router.post('/', soloDueno, validarCrearTrabajador, RegistrarTrabajador);
router.put('/:id', soloDueno, validarActualizarTrabajador, ActualizarTrabajador);

export default router;