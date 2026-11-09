import { listarHistorialCambios, crearHistorialCambio } from '../services/historialCambio.service.js';
import { validarCrearHistorialCambio } from '../schemas/historialCambio.schemas.js';
import { manejarError } from '../utils/errores.js';

export const getHistorialCambios = async (req, res) => {
  try {
    const historial = await listarHistorialCambios();
    res.json(historial);
  } catch (error) {
    manejarError(res, error);
  }
};

export const postHistorialCambio = async (req, res) => {
  try {
    validarCrearHistorialCambio(req.body);
    const nuevo = await crearHistorialCambio(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    manejarError(res, error);
  }
};