import {
  obtenerDetalleCorreccionMesService,
  corregirMontoMesCerradoService,
} from '../services/corregirMesCerrado.service.js';
import { manejarError } from '../utils/errores.js';

export const obtenerDetalleCorreccionMes = async (req, res) => {
  try {
    const resultado = await obtenerDetalleCorreccionMesService(req.periodo);
    return res.json(resultado);
  } catch (error) {
    return manejarError(res, error);
  }
};

export const corregirMontoMesCerrado = async (req, res) => {
  try {
    const id_contador = req.usuario?.id_contador || req.body?.id_contador || null;
    const { tabla, id_registro, nuevo_monto, motivo } = req.body;
    const resultado = await corregirMontoMesCerradoService({
      ...req.periodo,
      tabla,
      id_registro,
      nuevo_monto,
      motivo,
      id_contador,
    });
    return res.json(resultado);
  } catch (error) {
    return manejarError(res, error);
  }
};