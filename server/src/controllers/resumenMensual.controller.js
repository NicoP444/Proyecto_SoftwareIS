import { obtenerResumenFinancieroMensualService } from '../services/resumenMensual.service.js';
import { manejarError } from '../utils/errores.js';

export const obtenerResumenFinancieroMensual = async (req, res) => {
  try {
    const resultado = await obtenerResumenFinancieroMensualService(req.periodo);
    return res.json(resultado);
  } catch (error) {
    return manejarError(res, error);
  }
};