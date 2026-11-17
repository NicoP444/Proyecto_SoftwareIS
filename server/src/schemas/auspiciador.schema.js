import { body } from 'express-validator';

export const auspiciadorSchema = [
  body('nombre')
    .notEmpty().withMessage('El nombre del auspiciador es obligatorio.')
    .isString().withMessage('El nombre debe ser un texto válido.')
    .isLength({ min: 2, max: 80 }).withMessage('El nombre debe tener entre 2 y 80 caracteres.'),
  
  body('rubro')
    .optional({ checkFalsy: true })
    .isString().withMessage('El rubro debe ser un texto válido.')
    .isLength({ max: 80 }).withMessage('El rubro no puede superar los 80 caracteres.'),
  
  body('contacto')
    .optional({ checkFalsy: true })
    .isString().withMessage('El contacto debe ser un texto válido.')
    .isLength({ min: 2, max: 80 }).withMessage('El nombre de contacto debe tener entre 2 y 80 caracteres.'),
  
  body('telefono')
    .optional({ checkFalsy: true })
    .matches(/^\+?\d{7,15}$/).withMessage('El teléfono debe contener solo números (opcionalmente un "+" al inicio) y tener entre 7 y 15 dígitos.')
];