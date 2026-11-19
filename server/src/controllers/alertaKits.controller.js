import { obtenerKitsSinRetornoService } from '../services/alertaKits.service.js';
import { manejarError } from '../utils/errores.js';

export const getKitsSinRetorno = async (req, res) => {
  try {
    const alertas = await obtenerKitsSinRetornoService();
    return res.status(200).json(alertas);
  } catch (error) {
    return manejarError(res, error);
  }
};