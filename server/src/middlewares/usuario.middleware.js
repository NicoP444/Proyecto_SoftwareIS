import { validarBody, camposObligatorios, validarDueno } from './validate.middleware.js';
import {
  ValidarNombreUsuario,
  ValidarCorreo,
  ValidarRol
} from '../schemas/usuario.schemas.js';
import { manejarError, ValidationError } from '../utils/errores.js';

export const verificarSchemaCrearUsuario = async (req, res, next) => {
  try {
    const { nombre, correo, contrasena, rol } = req.body;

    req.body.nombre = ValidarNombreUsuario(nombre);
    req.body.correo = ValidarCorreo(correo);
    req.body.rol = ValidarRol(rol);

    if (!contrasena || String(contrasena).trim().length < 6) {
      throw new ValidationError(
        'La contraseña es obligatoria y debe tener al menos 6 caracteres',
        'contrasena'
      );
    }

    next();
  } catch (error) {
    return manejarError(res, error);
  }
};

export const verificarSchemaModificarUsuario = async (req, res, next) => {
  try {
    const { nombre, correo, rol } = req.body;

    if (nombre !== undefined) {
      req.body.nombre = ValidarNombreUsuario(nombre);
    }
    if (correo !== undefined) {
      req.body.correo = ValidarCorreo(correo);
    }
    if (rol !== undefined) {
      req.body.rol = ValidarRol(rol);
    }

    next();
  } catch (error) {
    return manejarError(res, error);
  }
};

export const validarCrearUsuario = [
  validarBody,
  camposObligatorios('nombre', 'correo', 'contrasena', 'rol', 'id_dueno'),
  verificarSchemaCrearUsuario,
  validarDueno,
];

export const validarModificarUsuario = [
  validarBody,
  camposObligatorios('nombre', 'correo', 'rol'),
  verificarSchemaModificarUsuario,
  validarDueno,
];

export const validarActualizarEstado = [
  validarBody,
  camposObligatorios('rol', 'estado'),
  validarDueno,
];