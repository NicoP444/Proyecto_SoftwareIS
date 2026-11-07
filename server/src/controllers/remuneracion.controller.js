import { manejarError } from '../utils/errores.js';
import { validarDefinirPorcentaje } from '../schemas/remuneracion.schemas.js';
import * as service from '../services/remuneracion.service.js';

export const listarPorEvento = async (req, res) => {
  try{
    return res.json(await service.listarPorEvento(Number(req.params.id)));
  }catch (error){
    return manejarError(res, error);
  }
};

export const definirPorcentaje = async (req, res) => {
  try{
    const datos = validarDefinirPorcentaje(req.body);
    return res.json(await service.definirPorcentaje(Number(req.params.id), datos));
  }catch (error){
    return manejarError(res, error);
  }
};