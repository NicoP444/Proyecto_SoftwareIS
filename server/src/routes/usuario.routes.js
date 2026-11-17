import { Router } from "express";
import { validarDueno, validarId } from "../middlewares/validate.middleware.js";
import { ListarUsuarios, CrearUsuario, ActualizarEstadoUsuario } from "../controllers/usuario.controller.js";

const router = Router();

// Listar usuarios (solo el dueño)
router.get('/', validarDueno, ListarUsuarios);

// Crear cuenta de usuario con rol (solo el dueño)
router.post('/', validarDueno, CrearUsuario);

// Modificar estado / desactivar usuario
router.put('/:id/estado', validarId, validarDueno, ActualizarEstadoUsuario);

export default router;