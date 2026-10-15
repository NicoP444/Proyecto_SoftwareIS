import { validarDisponibilidad } from '../schemas/disponibilidad.schemas.js';
import { manejarError } from '../utils/errores.js';
import { crearDisponibilidadService, listarDisponibilidadService } from '../services/disponibilidad.service.js';


export const crearDisponibilidad = async (req, res) => {
  try {
    const id_trabajador = Number(req.params.id); // tomamos la id del trabajador en la url 
    const id_dueno = Number(req.body.id_dueno); // y tomamos la id del dueño en el body

    const datos = validarDisponibilidad(req.body);

    const disponibilidad = await crearDisponibilidadService(id_trabajador, id_dueno, datos);

    return res.status(201).json({ // error 201: creado correctamente
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