import { Router } from "express";
import {
  getPersonalDisponible,
  getAsignaciones,
  postAsignacion,
  deleteAsignacion,
} from "../controllers/asignacion.controller.js";
import {
  validarId,
  validarBody,
  camposObligatorios,
  validarDueno,
} from "../middlewares/validate.middleware.js";
import { autenticar, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// RF-P1-03: quién está libre para una fecha y horario (solo consulta, solo el Dueño)
router.get(
  "/personal-disponible",
  autenticar,
  permitirRoles("DUENO"),
  validarDueno,
  getPersonalDisponible,
);

// RF-P3-01: dotación de un evento. Verla: cualquier usuario con sesión. Cambiarla: solo el Dueño.
router.get("/eventos/:id/asignaciones", autenticar, validarId, getAsignaciones);
router.post(
  "/eventos/:id/asignaciones",
  autenticar,
  permitirRoles("DUENO"),
  validarId,
  validarBody,
  camposObligatorios("id_trabajador", "id_rol"),
  validarDueno,
  postAsignacion,
);
router.delete(
  "/eventos/:id/asignaciones/:id_asignacion",
  autenticar,
  permitirRoles("DUENO"),
  validarId,
  deleteAsignacion,
);

export default router;
