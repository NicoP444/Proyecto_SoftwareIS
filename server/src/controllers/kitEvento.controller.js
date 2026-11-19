import { manejarError } from "../utils/errores.js";
import {
  listarKitsEvento,
  listarKitsDisponibles,
  reservarKit,
  quitarKit,
} from "../services/kitEvento.service.js";

// GET /api/eventos/:id/kits
export const getKitsEvento = async (req, res) => {
  try {
    return res.json(
      await listarKitsEvento(Number(req.params.id), req.user.id_dueno),
    );
  } catch (error) {
    return manejarError(res, error);
  }
};

// RF-P1-05: GET /api/eventos/:id/kits-disponibles?id_dueno=1
export const getKitsDisponibles = async (req, res) => {
  try {
    return res.json(
      await listarKitsDisponibles(Number(req.params.id), req.user.id_dueno),
    );
  } catch (error) {
    return manejarError(res, error);
  }
};

// RF-P1-05: POST /api/eventos/:id/kits
export const postKitEvento = async (req, res) => {
  try {
    const resultado = await reservarKit(Number(req.params.id), {
      id_kit: req.body.id_kit,
      id_dueno: req.user.id_dueno,
    });
    return res
      .status(201)
      .json({ mensaje: "Kit asignado correctamente", ...resultado });
  } catch (error) {
    return manejarError(res, error);
  }
};

// DELETE /api/eventos/:id/kits/:id_reserva
export const deleteKitEvento = async (req, res) => {
  try {
    const id_reserva = Number(req.params.id_reserva);
    if (!Number.isInteger(id_reserva) || id_reserva <= 0) {
      return res
        .status(400)
        .json({
          mensaje: "El id de la reserva no es válido",
          campo: "id_reserva",
        });
    }
    await quitarKit(Number(req.params.id), id_reserva, req.user.id_dueno);
    return res.json({ mensaje: "Kit quitado del evento" });
  } catch (error) {
    return manejarError(res, error);
  }
};
