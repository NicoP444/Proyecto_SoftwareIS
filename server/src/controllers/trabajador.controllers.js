// controllers/trabajador.controller.js
// Este es el mesero: recibe lo que pide el usuario, se lo pasa al service
// y le devuelve la respuesta.
import * as TrabajadorServicio from '../services/trabajador.service.js';
import { manejarError } from '../utils/errores.js';

export const ListarTrabajadores = async (req, res) => {
  try {
    const lista = await TrabajadorServicio.ListarTrabajadores(req.query.id_dueno);
    res.json(lista);
  } catch (error) {
    manejarError(res, error);
  }
};


export const RegistrarTrabajador = async (req, res) => {
  try {
    const NuevoTrabajador = await TrabajadorServicio.CrearTrabajador(req.body);
    res.status(201).json(NuevoTrabajador);
  } catch (error) {
    manejarError(res, error);
  }
};

export const ActualizarTrabajador = async (req, res) => {
  try {
    const TrabajadorActualizado = await TrabajadorServicio.ActualizarTrabajador(req.params.id, req.body);
    res.json(TrabajadorActualizado);
  } catch (error) {
    manejarError(res, error);
  }
};