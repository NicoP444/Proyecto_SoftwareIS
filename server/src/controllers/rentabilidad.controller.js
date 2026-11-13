import { manejarError } from '../utils/errores.js';
import { obtenerRentabilidad } from '../services/rentabilidad.service.js';

export const ver = async (req, res) => {
  try{
    return res.json(await obtenerRentabilidad(Number(req.params.id)));
  }catch (error){
    return manejarError(res, error);
  }
};