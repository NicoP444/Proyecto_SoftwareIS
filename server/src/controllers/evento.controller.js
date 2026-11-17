import { listarEventos, crearEvento, eliminarEvento, actualizarEvento } from '../services/evento.service.js';
import { manejarError } from '../utils/errores.js';

export async function getEventos(req, res) {
  try {
    res.json(await listarEventos(req.user.rol));
  } catch (error) { manejarError(res, error); }
}

export async function postEvento(req, res) {
  try {
    res.status(201).json(await crearEvento(req.body));
  } catch (error) { manejarError(res, error); }
}

export async function deleteEvento(req, res) {
  try {
    await eliminarEvento(Number(req.params.id), req.body.motivo);
    res.status(204).send();
  } catch (error) { manejarError(res, error); }
}

export async function putEvento(req, res) {
  try {
    res.json(await actualizarEvento(Number(req.params.id), req.body));
  } catch (error) { manejarError(res, error); }
}