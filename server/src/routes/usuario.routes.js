import { Router } from "express";
import { validarDueno, validarId } from "../middlewares/validate.middleware.js";
import { autenticar, permitirRoles } from "../middlewares/auth.middleware.js";
import { ListarUsuarios, CrearUsuario, ActualizarEstadoUsuario } from "../controllers/usuario.controller.js";

const router = Router();

// Administrar usuarios: solo el Dueño 

router.get('/', validarDueno, ListarUsuarios);
router.post('/', validarDueno, CrearUsuario);
router.put('/:id/estado', validarId, validarDueno, ActualizarEstadoUsuario);

export default router;