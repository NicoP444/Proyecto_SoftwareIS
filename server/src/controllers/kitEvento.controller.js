import { manejarError } from '../utils/errores.js';
import {
  listarKitsEvento,
  listarKitsDisponibles,
  reservarKit,
  quitarKit,
} from '../services/kitEvento.service.js';

// GET /api/eventos/:id/kits
export const getKitsEvento = async (req, res) => {
  try {
    return res.json(await listarKitsEvento(Number(req.params.id)));
  } catch (error) {
    return manejarError(res, error);
  }
};

// RF-P1-05: GET /api/eventos/:id/kits-disponibles?id_dueno=1
export const getKitsDisponibles = async (req, res) => {
  try {
    return res.json(await listarKitsDisponibles(Number(req.params.id)));
  } catch (error) {
    return manejarError(res, error);
  }
};

// RF-P1-05: POST /api/eventos/:id/kits
export const postKitEvento = async (req, res) => {
  try {
    const resultado = await reservarKit(Number(req.params.id), {
      id_kit: req.body.id_kit,
      id_dueno: Number(req.body.id_dueno),
    });
    return res.status(201).json({ mensaje: 'Kit asignado correctamente', ...resultado });
  } catch (error) {
    return manejarError(res, error);
  }
};

// DELETE /api/eventos/:id/kits/:id_reserva
export const deleteKitEvento = async (req, res) => {
  try {
    await quitarKit(Number(req.params.id), Number(req.params.id_reserva));
    return res.json({ mensaje: 'Kit quitado del evento' });
  } catch (error) {
    return manejarError(res, error);
  }
};