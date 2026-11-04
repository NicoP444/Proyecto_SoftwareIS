import { manejarError } from '../utils/errores.js';
import {
  validarCrearGasto,
  validarModificarGasto,
  validarEliminarGasto,
} from '../schemas/gastoEvento.schemas.js';
import * as service from '../services/gastoEvento.service.js';
import fs from 'fs/promises';

// Si la validación falla, el archivo ya fue guardado por multer: lo borramos
const limpiarArchivo = (file) => file && fs.unlink(file.path).catch(() => {});

export const crear = async (req, res) => {
  try{
    const datos = validarCrearGasto(req.body, req.file);
    const gasto = await service.crearGasto(datos);
    return res.status(201).json(gasto);
  }catch (error){
    await limpiarArchivo(req.file);
    return manejarError(res, error);
  }
};

export const listarPorEvento = async (req, res) => {
  try{
    const gastos = await service.listarGastosPorEvento(Number(req.params.id));
    return res.json(gastos);
  }catch (error){
    return manejarError(res, error);
  }
};

export const modificar = async (req, res) => {
  try{
    const datos = validarModificarGasto(req.body, req.file);
    const gasto = await service.modificarGasto(Number(req.params.id), datos);
    return res.json(gasto);
  }catch (error){
    await limpiarArchivo(req.file);
    return manejarError(res, error);
  }
};

export const eliminar = async (req, res) => {
  try{
    const datos = validarEliminarGasto(req.body);
    await service.eliminarGasto(Number(req.params.id), datos);
    return res.json({ mensaje: 'Gasto eliminado correctamente' });
  }catch (error){
    return manejarError(res, error);
  }
};