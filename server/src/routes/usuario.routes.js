import { Router } from "express";
import { autenticar, permitirRoles } from "../middlewares/auth.middleware.js";
import { validarId } from "../middlewares/validate.middleware.js";
import { ListarUsuarios, CrearUsuario, ActualizarEstadoUsuario, ModificarUsuario } from "../controllers/usuario.controller.js";

const router = Router();

router.use(autenticar, permitirRoles('DUENO'));

router.get('/', ListarUsuarios);
router.post('/', CrearUsuario);
router.put('/:id/estado', validarId, ActualizarEstadoUsuario);
router.put('/:id', validarId, ModificarUsuario);

export default router;