import {
  registrarGastoFijoService,
  listarGastosFijosPorMesService,
} from '../services/gastosFijos.service.js';

export const registrarGastoFijo = async (req, res, next) => {
  try {
    const id_contador = req.user?.id_contador || req.body.id_contador || 1;
    const gasto = await registrarGastoFijoService({ ...req.body, id_contador });
    return res.status(201).json({
      message: 'Gasto fijo registrado exitosamente.',
      data: gasto,
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ mensaje: error.message });
    }
    next(error);
  }
};

export const listarGastosFijos = async (req, res, next) => {
  try {
    const { anio, mes } = req.periodo;
    const data = await listarGastosFijosPorMesService(anio, mes);
    return res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};