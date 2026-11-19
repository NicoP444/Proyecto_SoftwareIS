import { manejarError, ValidationError } from '../utils/errores.js';
import {
  obtenerRentabilidad, listarRentabilidadPorMes, movimientosDeEvento,
} from '../services/rentabilidad.service.js';

export const ver = async (req, res) => {
  try{
    return res.json(await obtenerRentabilidad(Number(req.params.id)));
  }catch (error){
    return manejarError(res, error);
  }
};

// RF-P7-12: GET /rentabilidad/mes?anio=2026&mes=11
export const porMes = async (req, res) => {
  try{
    const anio = Number(req.query.anio);
    const mes = Number(req.query.mes);
    if(!Number.isInteger(anio) || anio < 2000 || anio > 2100){
      throw new ValidationError('El año no es válido', 'anio');
    }
    if(!Number.isInteger(mes) || mes < 1 || mes > 12){
      throw new ValidationError('El mes debe estar entre 1 y 12', 'mes');
    }
    return res.json(await listarRentabilidadPorMes(anio, mes));
  }catch (error){
    return manejarError(res, error);
  }
};

export const movimientos = async (req, res) => {
  try{
    return res.json(await movimientosDeEvento(Number(req.params.id)));
  }catch (error){
    return manejarError(res, error);
  }
};