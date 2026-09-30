import { listarEventos, crearEvento, eliminarEvento } from '../services/evento.service.js';

export async function getEventos(req, res, next) {
  try {
    res.json(await listarEventos());
  } catch (error) { next(error); }
}

export async function postEvento(req, res) {
  try {
    res.status(201).json(await crearEvento(req.body));
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
}

export async function deleteEvento(req, res) {
  try {
    await eliminarEvento(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
}