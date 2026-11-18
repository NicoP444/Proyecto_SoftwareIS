import { body } from 'express-validator';

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

// Verifica que una descripción tenga al menos 3 letras reales (permite "50 poleras", pero rechaza "22222222")
const validarDescripcionConLetras = (nombreCampo) => (valor) => {
  const texto = String(valor || '').trim();
  const cantLetras = (texto.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g) || []).length;
  if (cantLetras < 3) {
    throw new Error(`${nombreCampo} debe ser una descripción válida con palabras (no se permiten solo números o símbolos).`);
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
    .isInt({ min: 1, max: 500000000 }).withMessage('El monto comprometido debe ser un número entero entre $1 y $500.000.000.'),

  body('descripcion_canje')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString().withMessage('La descripción del canje debe ser un texto válido.')
    .isLength({ min: 3, max: 80 }).withMessage('La descripción del canje debe tener entre 3 y 80 caracteres.')
    .custom(validarDescripcionConLetras('La descripción del canje')),

  body('cant_menciones')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0, max: 500 }).withMessage('La cantidad de menciones debe estar entre 0 y 500.'),

  body('fecha_comprometida')
    .notEmpty().withMessage('La fecha límite de pago es obligatoria.')
    .custom(validarFechaDesdeHoy),

  body('glosa')
    .trim()
    .notEmpty().withMessage('La glosa del acuerdo es obligatoria.')
    .isString().withMessage('La glosa debe ser un texto válido.')
    .isLength({ min: 3, max: 80 }).withMessage('La glosa debe tener entre 3 y 80 caracteres.')
    .custom(validarDescripcionConLetras('La glosa'))
];

export const modificarAcuerdoSchema = [
  body('tipo_aporte')
    .optional()
    .isIn(['DINERO', 'CANJE']).withMessage('El tipo de aporte debe ser DINERO o CANJE.'),

  body('monto_comprometido')
    .notEmpty().withMessage('El monto comprometido es obligatorio.')
    .isInt({ min: 1, max: 500000000 }).withMessage('El monto comprometido debe ser un número entero entre $1 y $500.000.000.'),

  body('descripcion_canje')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString().withMessage('La descripción del canje debe ser un texto válido.')
    .isLength({ min: 3, max: 80 }).withMessage('La descripción del canje debe tener entre 3 y 80 caracteres.')
    .custom(validarDescripcionConLetras('La descripción del canje')),

  body('cant_menciones')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0, max: 500 }).withMessage('La cantidad de menciones debe estar entre 0 y 500.'),

  body('fecha_comprometida')
    .notEmpty().withMessage('La fecha comprometida es obligatoria.')
    .custom(validarFechaDesdeHoy),

  body('glosa')
    .trim()
    .notEmpty().withMessage('La glosa del acuerdo es obligatoria.')
    .isString().withMessage('La glosa debe ser un texto válido.')
    .isLength({ min: 3, max: 80 }).withMessage('La glosa debe tener entre 3 y 80 caracteres.')
    .custom(validarDescripcionConLetras('La glosa'))
];

export const cumplimientoAcuerdoSchema = [
  body('monto_recibido')
    .notEmpty().withMessage('El monto recibido es obligatorio.')
    .isFloat({ gt: 0 }).withMessage('El monto recibido debe ser mayor a 0.'),

  body('fecha_recibida')
    .notEmpty().withMessage('La fecha de recepción es obligatoria.')
    .custom(validarFechaDesdeHoy)
];

export const incobrableAcuerdoSchema = [
  body('motivo_incobrable')
    .trim()
    .notEmpty().withMessage('Debes indicar el motivo por el cual se declara incobrable.')
    .isString().withMessage('El motivo debe ser un texto válido.')
    .isLength({ min: 5, max: 120 }).withMessage('El motivo debe tener entre 5 y 120 caracteres.')
    .custom(validarDescripcionConLetras('El motivo de incobrabilidad'))
];