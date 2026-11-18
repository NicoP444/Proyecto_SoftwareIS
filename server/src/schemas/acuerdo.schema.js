import { body } from 'express-validator';

// Función auxiliar para obtener la fecha de hoy en formato YYYY-MM-DD (hora local)
const obtenerFechaHoyStr = () => {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const validarFechaDesdeHoy = (valor) => {
  if (!valor) throw new Error('La fecha es obligatoria.');
  const fechaInput = String(valor).slice(0, 10);
  const hoyStr = obtenerFechaHoyStr();
  if (fechaInput < hoyStr) {
    throw new Error('No se permiten fechas anteriores a hoy.');
  }
  return true;
};

export const crearAcuerdoSchema = [
  body('id_auspiciador')
    .notEmpty().withMessage('Debes seleccionar un auspiciador.')
    .isInt({ gt: 0 }).withMessage('El auspiciador seleccionado no es válido.'),

  body('id_evento')
    .notEmpty().withMessage('Debes seleccionar un evento.')
    .isInt({ gt: 0 }).withMessage('El evento seleccionado no es válido.'),

  body('tipo_aporte')
    .notEmpty().withMessage('El tipo de aporte es obligatorio.')
    .isIn(['DINERO', 'CANJE']).withMessage('El tipo de aporte debe ser DINERO o CANJE.'),

  body('monto_comprometido')
    .notEmpty().withMessage('El monto comprometido es obligatorio.')
    .isFloat({ gt: 0 }).withMessage('El monto comprometido debe ser mayor a 0.'),

  body('descripcion_canje')
    .optional({ checkFalsy: true })
    .isString().withMessage('La descripción del canje debe ser un texto válido.')
    .isLength({ max: 120 }).withMessage('La descripción del canje no puede superar los 120 caracteres.'),

  body('cant_menciones')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0, max: 1000 }).withMessage('La cantidad de menciones no puede ser negativa.'),

  body('fecha_comprometida')
    .notEmpty().withMessage('La fecha límite de pago es obligatoria.')
    .custom(validarFechaDesdeHoy),

  body('glosa')
    .notEmpty().withMessage('La glosa del acuerdo es obligatoria.')
    .isString().withMessage('La glosa debe ser un texto válido.')
    .isLength({ min: 3, max: 250 }).withMessage('La glosa debe tener entre 3 y 250 caracteres.')
];

export const modificarAcuerdoSchema = [
  body('tipo_aporte')
    .optional()
    .isIn(['DINERO', 'CANJE']).withMessage('El tipo de aporte debe ser DINERO o CANJE.'),

  body('monto_comprometido')
    .notEmpty().withMessage('El monto comprometido es obligatorio.')
    .isFloat({ gt: 0 }).withMessage('El monto comprometido debe ser mayor a 0.'),

  body('descripcion_canje')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('La descripción del canje debe ser un texto válido.')
    .isLength({ max: 120 }).withMessage('La descripción del canje no puede superar los 120 caracteres.'),

  body('cant_menciones')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0, max: 1000 }).withMessage('La cantidad de menciones no puede ser negativa.'),

  body('fecha_comprometida')
    .notEmpty().withMessage('La fecha comprometida es obligatoria.')
    .custom(validarFechaDesdeHoy),

  body('glosa')
    .notEmpty().withMessage('La glosa del acuerdo es obligatoria.')
    .isString().withMessage('La glosa debe ser un texto válido.')
    .isLength({ min: 3, max: 250 }).withMessage('La glosa debe tener entre 3 y 250 caracteres.')
];

export const cumplimientoAcuerdoSchema = [
  body('monto_recibido')
    .notEmpty().withMessage('El monto recibido es obligatorio.')
    .isFloat({ min: 0 }).withMessage('El monto recibido no puede ser negativo (ingresa 0 para restablecer o un monto positivo).'),

  body('fecha_recibida')
    .notEmpty().withMessage('La fecha de recepción es obligatoria.')
    .custom(validarFechaDesdeHoy)
];

export const incobrableAcuerdoSchema = [
  body('motivo_incobrable')
    .notEmpty().withMessage('Debes indicar el motivo por el cual se declara incobrable.')
    .isString().withMessage('El motivo debe ser un texto válido.')
    .isLength({ min: 3, max: 250 }).withMessage('El motivo debe tener entre 3 y 250 caracteres.')
];