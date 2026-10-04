import { Router } from "express";
import { validarDueno } from "../middlewares/validate.middleware.js";
import { ListarRol, CrearRol } from "../controllers/rol.controllers.js";
import { validarCrearRol } from "../middlewares/rol.middleware.js";


const router = Router();

router.get('/', validarDueno, ListarRol);
router.post('/', validarCrearRol, CrearRol);

export default router; // para exportar..
