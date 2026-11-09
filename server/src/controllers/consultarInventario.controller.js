import { consultarInventarioService } from '../services/consultarInventario.service.js';

export const getInventario = async (req, res, next) => {
  try {
    const data = await consultarInventarioService();
    return res.status(200).json({ data });
  } catch (error) {
    console.error('Error al consultar inventario:', error);
    next(error);
  }
};