import { validarId, validarBody, camposObligatorios, validarDueno } from './validate.middleware.js';
import { 
  VerificarNombre, 
  VerificarCorreo, 
  VerificarTelefono, 
  VerificarObservacion 
} from '../schemas/trabajador.shemas.js';
import { ValidationError } from '../utils/errores.js';

//limpiamos y validamos los datos de creación y actualización de trabajador
const limpiarYValidarCrear = (req, res, next) => {
  try {
    // le pasaamos el cuerpo
    req.body.nombre = VerificarNombre(req.body.nombre, true); 
    req.body.telefono_whatsapp = VerificarTelefono(req.body.telefono_whatsapp);
    req.body.correo = VerificarCorreo(req.body.correo);
    req.body.observaciones = VerificarObservacion(req.body.observaciones);
    
    next();// todo bien 
  } catch (error) { //error
    if (error instanceof ValidationError) {
      return res.status(400).json({ mensaje: error.message, campo: error.campo });
    }
    next(error);
  }
};

// actualizar el trabajador
const limpiarYValidarActualizar = (req, res, next) => {
  try {
    // le pasaamos el cuerpo
    req.body.nombre = VerificarNombre(req.body.nombre, false); 
    req.body.telefono_whatsapp = VerificarTelefono(req.body.telefono_whatsapp);
    req.body.correo = VerificarCorreo(req.body.correo);
    req.body.observaciones = VerificarObservacion(req.body.observaciones);
    
    next();// todo bien
  } catch (error) { //error
    if (error instanceof ValidationError) {
      return res.status(400).json({ mensaje: error.message, campo: error.campo });
    }
    next(error);
  }
};


// 3. Exportamos las rutas finales
export const validarCrearTrabajador = [
  validarBody,
  camposObligatorios('nombre', 'id_dueno'),
  validarDueno,
  limpiarYValidarCrear 
];

export const validarActualizarTrabajador = [
  validarId, 
  validarBody,
  limpiarYValidarActualizar
];