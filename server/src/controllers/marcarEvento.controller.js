import {
  marcarEventoRealizadoService,
  listarEventosParaRealizarService,
} from '../services/marcarEvento.service.js';
import { manejarError } from '../utils/errores.js';

export const marcarEventoRealizado = async (req, res) => {
  try {
    const { id_evento } = req.params;
    const evento = await marcarEventoRealizadoService(id_evento);
    return res.status(200).json({
      message: 'Evento marcado como realizado exitosamente.',
      data: evento,
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

export const listarEventosConfirmados = async (req, res) => {
  try {
    const eventos = await listarEventosParaRealizarService();
    return res.status(200).json({ data: eventos });
  } catch (error) {
    return manejarError(res, error);
  }
};