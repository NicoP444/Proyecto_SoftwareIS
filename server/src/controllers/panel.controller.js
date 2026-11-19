import { manejarError } from "../utils/errores.js";
import { obtenerPanel } from "../services/panel.service.js";

// GET /api/panel/:rol (la ruta ya exige que :rol sea el del usuario con sesión)
export const getPanel = async (req, res) => {
  try {
    res.json(await obtenerPanel(req.user.rol, req.user.id_dueno));
  } catch (error) {
    manejarError(res, error);
  }
};
