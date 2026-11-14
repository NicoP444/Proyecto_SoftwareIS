import { manejarError } from '../utils/errores.js';
import { historialDeTrabajador } from '../services/historialTrabajador.service.js';

export const ver = async (req, res) => {
  try{
    return res.json(await historialDeTrabajador(Number(req.params.id)));
  }catch (error){
    return manejarError(res, error);
  }
};