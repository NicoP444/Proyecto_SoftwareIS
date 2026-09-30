import { listarClientes, crearCliente } from '../services/cliente.service.js';

export async function getClientes(req, res, next) {
  try {
    res.json(await listarClientes());
  } catch (error) { next(error); }
}

export async function postCliente(req, res) {
  try {
    res.status(201).json(await crearCliente(req.body));
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
}