import { manejarError } from '../utils/errores.js';
import { calcularViabilidad, guardarGastosEstimados } from '../services/viabilidad.service.js';

export const ver = async (req, res) => {
  try {
    res.json(await calcularViabilidad(Number(req.params.id)));
  } catch (error) { manejarError(res, error); }
};

export const guardarGastos = async (req, res) => {
  try {
    res.json(await guardarGastosEstimados(Number(req.params.id), req.body));
  } catch (error) { manejarError(res, error); }
};