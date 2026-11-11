import { manejarError } from '../utils/errores.js';
import { obtenerMargenTraslado, actualizarMargenTraslado } from '../services/configuracion.service.js';

// GET /api/configuracion/margen-traslado?id_dueno=1
export const getMargenTraslado = async (req, res) => {
  try {
    return res.json(await obtenerMargenTraslado(Number(req.query.id_dueno)));
  } catch (error) {
    return manejarError(res, error);
  }
};

// PUT /api/configuracion/margen-traslado   { id_dueno, margen_traslado_min }
export const putMargenTraslado = async (req, res) => {
  try {
    const resultado = await actualizarMargenTraslado(Number(req.body.id_dueno), req.body.margen_traslado_min);
    return res.json({ mensaje: 'Margen de traslado actualizado', ...resultado });
  } catch (error) {
    return manejarError(res, error);
  }
};