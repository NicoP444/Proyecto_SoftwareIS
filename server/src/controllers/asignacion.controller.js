import { manejarError } from '../utils/errores.js';
import {
  listarPersonalDisponible,
  listarPersonalConEstado,
  listarAsignaciones,
  asignarTrabajador,
  quitarAsignacion,
} from '../services/asignacion.service.js';

// RF-P1-03: GET /api/personal-disponible?id_dueno=1&fecha=...&hora_inicio=...&hora_termino=...&id_rol=...
export const getPersonalDisponible = async (req, res) => {
  try {
    const { fecha, hora_inicio, hora_termino, id_rol, id_evento, todos } = req.query;

    // todos=true: lista a todo el personal con su estado (ventana "Personal disponible")
    if (todos === 'true') {
      const personal = await listarPersonalConEstado({
        id_dueno: Number(req.query.id_dueno),
        fecha,
        hora_inicio,
        hora_termino,
      });
      return res.json(personal);
    }

    const disponibles = await listarPersonalDisponible({
      id_dueno: Number(req.query.id_dueno),
      fecha,
      hora_inicio,
      hora_termino,
      id_rol: id_rol ? Number(id_rol) : null,
      id_evento: id_evento ? Number(id_evento) : null,
    });
    return res.json(disponibles);
  } catch (error) {
    return manejarError(res, error);
  }
};

// GET /api/eventos/:id/asignaciones
export const getAsignaciones = async (req, res) => {
  try {
    return res.json(await listarAsignaciones(Number(req.params.id)));
  } catch (error) {
    return manejarError(res, error);
  }
};

// RF-P3-01: POST /api/eventos/:id/asignaciones
export const postAsignacion = async (req, res) => {
  try {
    const resultado = await asignarTrabajador(Number(req.params.id), {
      id_trabajador: req.body.id_trabajador,
      id_rol: req.body.id_rol,
      id_dueno: Number(req.body.id_dueno),
    });
    return res.status(201).json({ mensaje: 'Trabajador asignado correctamente', ...resultado });
  } catch (error) {
    return manejarError(res, error);
  }
};

// DELETE /api/eventos/:id/asignaciones/:id_asignacion
export const deleteAsignacion = async (req, res) => {
  try {
    const id_asignacion = Number(req.params.id_asignacion);
    if (!Number.isInteger(id_asignacion) || id_asignacion <= 0) {
      return res.status(400).json({ mensaje: 'El id de la asignación no es válido', campo: 'id_asignacion' });
    }
    await quitarAsignacion(Number(req.params.id), id_asignacion);
    return res.json({ mensaje: 'Trabajador quitado del evento' });
  } catch (error) {
    return manejarError(res, error);
  }
};