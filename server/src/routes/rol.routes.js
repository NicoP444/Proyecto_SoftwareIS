import { Router } from "express";
import { validarDueno } from "../middlewares/validate.middleware.js";
import { ListarRol, CrearRol, ActualizarRol } from "../controllers/rol.controllers.js";
import { validarCrearRol, validarActualizarRol } from "../middlewares/rol.middleware.js";


const router = Router();

router.get('/', validarDueno, ListarRol);
router.post('/', validarCrearRol, CrearRol);
router.put('/:id', validarActualizarRol, ActualizarRol);

export default router; // para exportar..
