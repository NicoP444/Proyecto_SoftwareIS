import { Router } from "express";
import { autenticar, permitirRoles } from "../middlewares/auth.middleware.js";
import { validarId } from "../middlewares/validate.middleware.js";
import { ListarUsuarios, CrearUsuario, ActualizarEstadoUsuario } from "../controllers/usuario.controller.js";

const router = Router();

// RF-T-03: Las rutas de usuarios deben estar completamente protegidas por autenticación y rol de Dueño
router.use(autenticar, permitirRoles('DUENO'));

router.get('/', ListarUsuarios);
router.post('/', CrearUsuario);
router.put('/:id/estado', validarId, ActualizarEstadoUsuario);

export default router;