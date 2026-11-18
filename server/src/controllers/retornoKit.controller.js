import {
  obtenerKitsEnTerrenoService,
  registrarRetornoService,
} from '../services/retornoKit.service.js';
import { manejarError } from '../utils/errores.js';

export const obtenerKitsEnTerreno = async (req, res) => {
  try {
    const data = await obtenerKitsEnTerrenoService();
    res.json(data);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

export const registrarRetorno = async (req, res) => {
  try {
    const { id_salida, revisiones } = req.body;
    const id_jefe = req.usuario?.id_jefe || req.usuario?.id || req.body?.id_jefe;

    if (!id_salida || !revisiones || !Array.isArray(revisiones) || revisiones.length === 0) {
      return res.status(400).json({ mensaje: 'Datos insuficientes para procesar el retorno.' });
    }

    const resultado = await registrarRetornoService({ id_salida, id_jefe, revisiones });
    res.json(resultado);
  } catch (error) {
    return manejarError(res, error);
  }
};