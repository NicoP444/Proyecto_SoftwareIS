import { body } from 'express-validator';

const obtenerFechaHoyStr = () => {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

// Acepta YYYY-MM-DD o MM/DD/YYYY y verifica que sea desde hoy en adelante
const normalizarFechaISO = (valor) => {
  if (!valor) return '';
  const str = String(valor).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  const partes = str.split(/[/-]/);
  if (partes.length === 3 && partes[2].length === 4) {
    const p0 = Number(partes[0]);
    const p1 = Number(partes[1]);
    // Si el segundo número es > 12 es formato MM/DD/YYYY
    if (p1 > 12) {
      return `${partes[2]}-${String(p0).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
    }
    return `${partes[2]}-${String(p1).padStart(2, '0')}-${String(p0).padStart(2, '0')}`;
  }
  return str.slice(0, 10);
};

// Verifica que una descripción tenga al menos 3 letras reales
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
    .optional({ nullable: true })
    .isIn(['DINERO', 'CANJE']).withMessage('El tipo de aporte debe ser DINERO o CANJE.'),

  body('monto_comprometido')
    .custom((valor, { req }) => {
      const monto = valor ?? req.body.monto;
      const num = Number(monto);
      if (!monto || !Number.isInteger(num) || num < 1 || num > 500000000) {
        throw new Error('El monto comprometido debe ser un número entero entre $1 y $500.000.000.');
      }
      return true;
    }),

  body('descripcion_canje')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString().withMessage('La descripción del canje debe ser un texto válido.')
    .isLength({ min: 3, max: 80 }).withMessage('La descripción del canje debe tener entre 3 y 80 caracteres.')
    .custom(validarDescripcionConLetras('La descripción del canje')),

  body('cant_menciones')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0, max: 50 }).withMessage('La cantidad de menciones debe estar entre 0 y 50.'),

  body('fecha_comprometida')
    .custom((valor, { req }) => {
      const fechaBruta = valor || req.body.fecha_limite || req.body.fecha;
      if (!fechaBruta) {
        throw new Error('La fecha límite de pago es obligatoria.');
      }
      const fechaInput = normalizarFechaISO(fechaBruta);
      const hoyStr = obtenerFechaHoyStr();
      if (fechaInput < hoyStr) {
        throw new Error('No se permiten fechas anteriores a hoy.');
      }
      return true;
    }),

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
    .custom((valor, { req }) => {
      const monto = valor ?? req.body.monto;
      const num = Number(monto);
      if (!monto || !Number.isInteger(num) || num < 1 || num > 500000000) {
        throw new Error('El monto comprometido debe ser un número entero entre $1 y $500.000.000.');
      }
      return true;
    }),

  body('descripcion_canje')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString().withMessage('La descripción del canje debe ser un texto válido.')
    .isLength({ min: 3, max: 80 }).withMessage('La descripción del canje debe tener entre 3 y 80 caracteres.')
    .custom(validarDescripcionConLetras('La descripción del canje')),

  body('cant_menciones')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0, max: 50 }).withMessage('La cantidad de menciones debe estar entre 0 y 50.'),

  body('fecha_comprometida')
    .custom((valor, { req }) => {
      const fechaBruta = valor || req.body.fecha_limite || req.body.fecha;
      if (!fechaBruta) {
        throw new Error('La fecha comprometida es obligatoria.');
      }
      const fechaInput = normalizarFechaISO(fechaBruta);
      const hoyStr = obtenerFechaHoyStr();
      if (fechaInput < hoyStr) {
        throw new Error('No se permiten fechas anteriores a hoy.');
      }
      return true;
    }),

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
    .isFloat({ min: 0, max: 500000000 }).withMessage('El monto recibido debe ser un valor positivo.'),

  body('fecha_recibida')
    .custom((valor, { req }) => {
      const fechaBruta = valor || req.body.fecha;
      if (!fechaBruta) {
        throw new Error('La fecha de recepción es obligatoria.');
      }
      const fechaInput = normalizarFechaISO(fechaBruta);
      const hoyStr = obtenerFechaHoyStr();
      if (fechaInput > hoyStr) {
        throw new Error('La fecha de recepción del pago no puede ser una fecha futura.');
      }
      if (fechaInput < '2000-01-01') {
        throw new Error('La fecha de recepción no puede ser anterior al año 2000.');
      }
      return true;
    })
];

export const incobrableAcuerdoSchema = [
  body('motivo_incobrable')
    .trim()
    .notEmpty().withMessage('Debes indicar el motivo por el cual se declara incobrable.')
    .isString().withMessage('El motivo debe ser un texto válido.')
    .isLength({ min: 5, max: 120 }).withMessage('El motivo debe tener entre 5 y 120 caracteres.')
    .custom(validarDescripcionConLetras('El motivo de incobrabilidad'))
];