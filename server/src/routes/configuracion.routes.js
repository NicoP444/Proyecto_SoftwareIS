import { Router } from "express";
import {
  getMargenTraslado,
  putMargenTraslado,
} from "../controllers/configuracion.controller.js";
import {
  validarBody,
  camposObligatorios,
  validarDueno,
} from "../middlewares/validate.middleware.js";
import { autenticar, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// RF-P3-02: margen de traslado entre eventos en lugares distintos (solo el Dueño)
router.get(
  "/margen-traslado",
  autenticar,
  permitirRoles("DUENO"),
  validarDueno,
  getMargenTraslado,
);
router.put(
  "/margen-traslado",
  autenticar,
  permitirRoles("DUENO"),
  validarBody,
  camposObligatorios("margen_traslado_min"),
  validarDueno,
  putMargenTraslado,
);

export default router;
