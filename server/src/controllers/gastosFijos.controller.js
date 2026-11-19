import {
  registrarGastoFijoService,
  listarGastosFijosPorMesService,
  actualizarGastoFijoService,
  eliminarGastoFijoService,
} from '../services/gastosFijos.service.js';
import { manejarError } from '../utils/errores.js';

export const registrarGastoFijo = async (req, res) => {
  try {
    const id_contador = req.usuario?.id_contador || req.user?.id_contador;

    if (!id_contador) {
      return res.status(401).json({ mensaje: 'No se pudo identificar al Contador desde la sesión.' });
    }

    const gasto = await registrarGastoFijoService({ ...req.body, id_contador });
    return res.status(201).json({
      message: 'Gasto fijo registrado exitosamente.',
      data: gasto,
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

export const listarGastosFijos = async (req, res) => {
  try {
    const { anio, mes } = req.periodo;
    const data = await listarGastosFijosPorMesService(anio, mes);
    return res.status(200).json({ data });
  } catch (error) {
    return manejarError(res, error);
  }
};

export const actualizarGastoFijo = async (req, res) => {
  try {
    const id_contador = req.usuario?.id_contador || req.user?.id_contador;
    if (!id_contador) {
      return res.status(401).json({ mensaje: 'No se pudo identificar al Contador desde la sesión.' });
    }

    const gasto = await actualizarGastoFijoService(req.params.id, { ...req.body, id_contador });
    return res.status(200).json({
      message: 'Gasto fijo actualizado exitosamente.',
      data: gasto,
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

export const eliminarGastoFijo = async (req, res) => {
  try {
    const id_contador = req.usuario?.id_contador || req.user?.id_contador;
    if (!id_contador) {
      return res.status(401).json({ mensaje: 'No se pudo identificar al Contador desde la sesión.' });
    }

    const data = await eliminarGastoFijoService(req.params.id, {
      motivo: req.body?.motivo,
      id_contador,
    });
    return res.status(200).json({
      message: 'Gasto fijo eliminado exitosamente.',
      data,
    });
  } catch (error) {
    return manejarError(res, error);
  }
};