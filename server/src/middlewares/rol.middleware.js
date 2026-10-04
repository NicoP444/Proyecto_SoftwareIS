import { validarId, validarBody, camposObligatorios, validarDueno } from './validate.middleware.js';
import { ValidarNombreRol, VerificarDuplicado, ValidarPorcentaje } from '../schemas/rol.schemas.js';
import { manejarError } from '../utils/errores.js';


export const verificarSchemaRol = async (req, res, next) => {
    try {
        // 1. Validamos y limpiamos el nombre
        const nombreLimpio = ValidarNombreRol(req.body.nombre);
        if (nombreLimpio) {
            await VerificarDuplicado(nombreLimpio);
            req.body.nombre = nombreLimpio;
        }

        // 2. Validamos y limpiamos el porcentaje (NUEVO)
        // Se ejecuta solo si el cliente envió el dato en el body
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


