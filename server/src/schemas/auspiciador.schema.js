import { body } from 'express-validator';

// Exige que el texto contenga al menos 2 letras reales (no permite solo números ni símbolos)
const contieneLetrasReales = (valor) => {
  const letras = (String(valor || '').match(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g) || []).length;
  return letras >= 2;
};

// Solo letras y espacios (para nombres de personas y rubros)
const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.,'-]+$/;

export const auspiciadorSchema = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre del auspiciador es obligatorio.')
    .isString().withMessage('El nombre debe ser un texto válido.')
    .isLength({ min: 2, max: 60 }).withMessage('El nombre debe tener entre 2 y 60 caracteres.')
    .custom((val) => {
      if (!contieneLetrasReales(val)) {
        throw new Error('El nombre del auspiciador debe contener letras y no puede ser solo números.');
      }
      return true;
    }),

  body('rubro')
    .trim()
    .notEmpty().withMessage('El rubro es obligatorio.')
    .isString().withMessage('El rubro debe ser un texto válido.')
    .isLength({ min: 3, max: 50 }).withMessage('El rubro debe tener entre 3 y 50 caracteres.')
    .matches(regexSoloLetras).withMessage('El rubro solo puede contener letras (no se permiten números).')
    .custom((val) => {
      if (!contieneLetrasReales(val)) {
        throw new Error('El rubro debe contener un texto válido.');
      }
      return true;
    }),

  body('contacto')
    .trim()
    .notEmpty().withMessage('El nombre del contacto es obligatorio.')
    .isString().withMessage('El contacto debe ser un texto válido.')
    .isLength({ min: 3, max: 60 }).withMessage('El nombre del contacto debe tener entre 3 y 60 caracteres.')
    .matches(regexSoloLetras).withMessage('El nombre del contacto solo puede contener letras (sin números).')
    .custom((val) => {
      if (!contieneLetrasReales(val)) {
        throw new Error('El nombre del contacto debe ser un nombre válido.');
      }
      return true;
    }),

  body('telefono')
    .trim()
    .notEmpty().withMessage('El teléfono es obligatorio.')
    .matches(/^\+?\d{7,15}$/).withMessage('El teléfono debe contener solo números (opcionalmente "+" al inicio) y tener entre 7 y 15 dígitos.'),

  body('clasificacion')
    .optional()
    .isIn(['CONFIABLE', 'NO_CONFIABLE']).withMessage('La clasificación no es válida.'),

  body('motivo_clasificacion')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 5, max: 120 }).withMessage('El motivo de clasificación debe tener entre 5 y 120 caracteres.')
    .custom((val) => {
      if (!contieneLetrasReales(val)) {
        throw new Error('El motivo debe ser una descripción real con letras (no solo números).');
      }
      return true;
    })
];