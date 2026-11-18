import { Router } from "express";
import { validarId } from "../middlewares/validate.middleware.js";
import { ListarRol, CrearRol, ActualizarRol } from "../controllers/rol.controllers.js";
import { validarCrearRol, validarActualizarRol } from "../middlewares/rol.middleware.js";
import { autenticar, permitirRoles, idDesdeSesion } from "../middlewares/auth.middleware.js";

const router = Router();
const soloDueno = [autenticar, permitirRoles('DUENO'), idDesdeSesion];

router.get('/', soloDueno, ListarRol);
router.post('/', soloDueno, validarCrearRol, CrearRol);
router.put('/:id', soloDueno, validarId, validarActualizarRol, ActualizarRol);

export default router;