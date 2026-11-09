import { validarDisponibilidad } from '../schemas/disponibilidad.schemas.js';
import { manejarError } from '../utils/errores.js';
import { 
  crearDisponibilidadService, 
  listarDisponibilidadService,
  actualizarDisponibilidadService
} from '../services/disponibilidad.service.js';

export const crearDisponibilidad = async (req, res) => {
  try {
    const id_trabajador = Number(req.params.id); 
    const id_dueno = Number(req.body.id_dueno); 

    const datos = validarDisponibilidad(req.body);

    const disponibilidad = await crearDisponibilidadService(id_trabajador, id_dueno, datos);

    return res.status(201).json({ 
      mensaje: 'Disponibilidad registrada correctamente',
      disponibilidad,
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

export const listarDisponibilidad = async (req, res) => {
  try {
    const id_trabajador = Number(req.params.id);

    const disponibilidades = await listarDisponibilidadService(id_trabajador);

    return res.status(200).json({ disponibilidades });
  } catch (error) {
    return manejarError(res, error);
  }
};

export const actualizarDisponibilidad = async (req, res) => {
  try {
    const id_trabajador = Number(req.params.id);
    const nro_bloque = Number(req.params.nro_bloque);

    if (!Number.isInteger(nro_bloque) || nro_bloque <= 0) {
      return res.status(400).json({ mensaje: 'El número de bloque no es válido', campo: 'nro_bloque' });
    }

    const datos = validarDisponibilidad(req.body);
    const disponibilidad = await actualizarDisponibilidadService(id_trabajador, nro_bloque, datos);

    return res.status(200).json({
      mensaje: 'Disponibilidad actualizada correctamente',
      disponibilidad,
    });
  } catch (error) {
    return manejarError(res, error);
  }
};