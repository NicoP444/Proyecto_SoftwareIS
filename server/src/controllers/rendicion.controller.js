import { manejarError } from '../utils/errores.js';
import { validarMarcarRendicion } from '../schemas/rendicion.schemas.js';
import * as service from '../services/rendicion.service.js';

export const listarPorEvento = async (req, res) => {
  try{
    const resultado = await service.listarRendicionesPorEvento(Number(req.params.id));
    return res.json(resultado);
  }catch (error){
    return manejarError(res, error);
  }
};

export const marcar = async (req, res) => {
  try{
    const datos = validarMarcarRendicion(req.body);
    const resultado = await service.marcarRendicion(Number(req.params.id), datos);
    return res.json(resultado);
  }catch (error){
    return manejarError(res, error);
  }
};