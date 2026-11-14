import { validarPreCierreMesService, cerrarMesContableService } from '../services/cierreMes.service.js';
import { manejarError } from '../utils/errores.js';

export const validarPreCierreMes = async (req, res) => {
  try {
    const resultado = await validarPreCierreMesService(req.periodo);
    return res.json(resultado);
  } catch (error) {
    return manejarError(res, error);
  }
};

export const cerrarMesContable = async (req, res) => {
  try {
    const id_contador = req.usuario?.id_contador || req.body?.id_contador || null;
    const resultado = await cerrarMesContableService({
      ...req.periodo,
      id_contador,
    });
    return res.json(resultado);
  } catch (error) {
    return manejarError(res, error);
  }
};