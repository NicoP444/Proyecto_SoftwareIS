import { manejarError } from '../utils/errores.js';
import { obtenerPanel } from '../services/panel.service.js';

// GET /api/panel/:rol   (DUENO, CONTADOR o JEFE_TECNICO)
export const getPanel = async (req, res) => {
  try {
    res.json(await obtenerPanel(req.params.rol));
  } catch (error) { manejarError(res, error); }
};