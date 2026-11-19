import { Router } from "express";
import { getPanel } from "../controllers/panel.controller.js";
import { autenticar } from "../middlewares/auth.middleware.js";

const router = Router();

// Cada usuario solo puede pedir el panel de su propio rol
const soloSuPanel = (req, res, next) => {
  if (String(req.params.rol).toUpperCase() !== req.user.rol) {
    return res
      .status(403)
      .json({ mensaje: "Permiso insuficiente para realizar esta acción" });
  }
  next();
};

// RF-T-07: datos del panel de inicio según el rol
router.get("/:rol", autenticar, soloSuPanel, getPanel);

export default router;
