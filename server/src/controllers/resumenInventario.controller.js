import { obtenerResumenInventarioService } from '../services/resumenInventario.service.js';
import { manejarError } from '../utils/errores.js';

export const obtenerResumenInventario = async (req, res) => {
  try {
    const resultado = await obtenerResumenInventarioService(req.periodo);
    return res.json(resultado);
  } catch (error) {
    return manejarError(res, error);
  }
};