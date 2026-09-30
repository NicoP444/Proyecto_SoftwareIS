//importacion de rutas 
import { Router } from 'express';
import { getClientes, postCliente } from '../controllers/cliente.controller.js';
import { camposObligatorios } from '../middlewares/validate.middleware.js'; //validar, autenticar, transformar una peticion antes de llegar al controller

const router = Router(); //creamos un router para manejar las rutas de clientes
router.get('/', getClientes);
router.post('/', camposObligatorios('nombre', 'telefono'), postCliente); 

export default router;