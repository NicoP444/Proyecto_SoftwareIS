import { listarRecintos, crearRecinto } from '../services/recinto.service.js';

export async function getRecintos(req, res, next) {
  try {
    res.json(await listarRecintos());
  } catch (error) { next(error); }
}

export async function postRecinto(req, res) {
  try {
    res.status(201).json(await crearRecinto(req.body));
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
}