//importacion de rutas
import { Router } from 'express';
import { getClientes, postCliente, putCliente, deleteCliente } from '../controllers/cliente.controller.js';
import { camposObligatorios, validarId } from '../middlewares/validate.middleware.js'; //validar, autenticar, transformar una peticion antes de llegar al controller
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router(); //creamos un router para manejar las rutas de clientes

// RF-P1-01: los clientes los gestiona solo el Dueño
router.use(autenticar, permitirRoles('DUENO'));

router.get('/', getClientes);
router.post('/', camposObligatorios('rut', 'nombre', 'telefono'), postCliente);
router.put('/:id', validarId, camposObligatorios('rut', 'nombre', 'telefono'), putCliente);
router.delete('/:id', validarId, deleteCliente);

export default router;