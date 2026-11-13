import { obtenerKitsSinRetornoService } from '../services/alertaKits.service.js';

export const getKitsSinRetorno = async (req, res, next) => {
  try {
    const alertas = await obtenerKitsSinRetornoService();
    return res.status(200).json(alertas);
  } catch (error) {
    console.error('Error al consultar kits sin retorno:', error);
    next(error);
  }
};