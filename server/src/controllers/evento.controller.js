import {
  listarEventos,
  crearEvento,
  eliminarEvento,
  actualizarEvento,
  listarHistorialEvento,
} from "../services/evento.service.js";
import { manejarError } from "../utils/errores.js";

export async function getEventos(req, res) {
  try {
    res.json(await listarEventos(req.user));
  } catch (error) {
    manejarError(res, error);
  }
}

export async function postEvento(req, res) {
  try {
    res.status(201).json(await crearEvento(req.body, req.user.id_dueno));
  } catch (error) {
    manejarError(res, error);
  }
}

export async function deleteEvento(req, res) {
  try {
    await eliminarEvento(
      Number(req.params.id),
      req.body.motivo,
      req.user.id_dueno,
    );
    res.status(204).send();
  } catch (error) {
    manejarError(res, error);
  }
}

export async function putEvento(req, res) {
  try {
    res.json(
      await actualizarEvento(
        Number(req.params.id),
        req.body,
        req.user.id_dueno,
      ),
    );
  } catch (error) {
    manejarError(res, error);
  }
}

export async function getHistorialEvento(req, res) {
  try {
    res.json(await listarHistorialEvento(Number(req.params.id), req.user));
  } catch (error) {
    manejarError(res, error);
  }
}
