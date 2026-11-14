import { obtenerPerdidasInventarioService } from '../services/perdidasInventario.service.js';
import { manejarError } from '../utils/errores.js';

export const listarPerdidasInventario = async (req, res) => {
  try {
    const resultado = await obtenerPerdidasInventarioService(req.periodo);
    return res.json(resultado);
  } catch (error) {
    return manejarError(res, error);
  }
};