import { validarBody, camposObligatorios, validarDueno } from './validate.middleware.js';
import { ValidarNombreRol, VerificarDuplicado, ValidarPorcentaje } from '../schemas/rol.schemas.js';
import { manejarError } from '../utils/errores.js';


export const verificarSchemaRol = async (req, res, next) => {
    try {
        // Obtenemos el ID de los parámetros si estamos actualizando un registro existente
        const idRol = req.params.id ? Number(req.params.id) : null;

        // 1. Validamos y limpiamos el nombre
        const nombreLimpio = ValidarNombreRol(req.body.nombre);
        if (nombreLimpio) {
            // Le pasamos el idRol para que ignore su propio nombre al verificar duplicados
            await VerificarDuplicado(nombreLimpio, idRol);
            req.body.nombre = nombreLimpio;
        }

        // 2. Validamos y limpiamos el porcentaje
        if (req.body.porcentaje_referencial !== undefined) {
            req.body.porcentaje_referencial = ValidarPorcentaje(req.body.porcentaje_referencial);
        }

        next(); 
    } catch (error) {
        return manejarError(res, error);
    }
};

export const validarCrearRol = [
  validarBody,
  camposObligatorios('nombre', 'id_dueno'),
  verificarSchemaRol,
  validarDueno,
];


export const validarActualizarRol = [
    validarBody,
    verificarSchemaRol,
    validarDueno
];

