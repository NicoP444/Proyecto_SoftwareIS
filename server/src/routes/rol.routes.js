import { Router } from "express";
import { validarDueno } from "../middlewares/validate.middleware.js";
import { ListarRol } from "../controllers/rol.controllers.js";



const router = Router();

router.get('/', validarDueno, ListarRol);

export default router; // para exportar..
