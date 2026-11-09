import {
  marcarEventoRealizadoService,
  listarEventosParaRealizarService,
} from '../services/marcarEvento.service.js';

export const marcarEventoRealizado = async (req, res, next) => {
  try {
    const { id_evento } = req.params;
    const evento = await marcarEventoRealizadoService(id_evento);
    return res.status(200).json({
      message: 'Evento marcado como realizado exitosamente.',
      data: evento,
    });
  } catch (error) {
    next(error);
  }
};

export const listarEventosConfirmados = async (req, res, next) => {
  try {
    const eventos = await listarEventosParaRealizarService();
    return res.status(200).json({ data: eventos });
  } catch (error) {
    next(error);
  }
};