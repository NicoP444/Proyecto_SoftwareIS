import { body, param } from 'express-validator';

// Fecha de hoy en formato YYYY-MM-DD (hora local)
const obtenerFechaHoyStr = () => {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

// Permite fechas pasadas o de hoy, pero bloquea fechas futuras
const validarFechaCompraNoFutura = (valor) => {
  if (!valor) throw new Error('La fecha de compra es obligatoria.');
  const fechaInput = String(valor).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaInput)) {
    throw new Error('El formato de la fecha de compra no es válido.');
  }
  const hoyStr = obtenerFechaHoyStr();
  if (fechaInput > hoyStr) {
    throw new Error('La fecha de compra no puede ser una fecha futura.');
  }
  if (fechaInput < '2000-01-01') {
    throw new Error('La fecha de compra no puede ser anterior al año 2000.');
  }
  return true;
};

// Verifica que el campo tenga al menos N letras reales (bloquea "222", "2222", etc.)
const exigirLetras = (nombreCampo, minLetras = 2) => (valor) => {
  const texto = String(valor || '').trim();
  const cantLetras = (texto.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g) || []).length;
  if (cantLetras < minLetras) {
    throw new Error(`${nombreCampo} debe contener al menos ${minLetras} letras (no se permiten solo números o símbolos).`);
  }
  return true;
};

export const validarCodigoParamSchema = [
  param('codigo')
    .trim()
    .notEmpty().withMessage('El código del equipo es obligatorio.')
    .matches(/^[A-Za-z0-9-]+$/).withMessage('El formato del código del equipo no es válido.')
];

export const crearEquipoSchema = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre del equipo es obligatorio.')
    .isString().withMessage('El nombre debe ser un texto válido.')
    .isLength({ min: 3, max: 60 }).withMessage('El nombre del equipo debe tener entre 3 y 60 caracteres.')
    .custom(exigirLetras('El nombre del equipo', 2)),

  body('categoria')
    .trim()
    .notEmpty().withMessage('La categoría es obligatoria.')
    .isIn(['CAMARA', 'TRIPODE', 'MICROFONO', 'SWITCH_VIDEO', 'OTRO'])
    .withMessage('La categoría seleccionada no es válida.'),

  body('marca')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString().withMessage('La marca debe ser un texto válido.')
    .isLength({ min: 2, max: 40 }).withMessage('La marca debe tener entre 2 y 40 caracteres.')
    .custom(exigirLetras('La marca', 2)),

  body('modelo')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString().withMessage('El modelo debe ser un texto válido.')
    .isLength({ min: 2, max: 40 }).withMessage('El modelo debe tener entre 2 y 40 caracteres.')
    .custom(exigirLetras('El modelo', 1)),

  body('fecha_compra')
    .notEmpty().withMessage('La fecha de compra es obligatoria.')
    .custom(validarFechaCompraNoFutura),

  body('valor_compra')
    .notEmpty().withMessage('El valor de compra es obligatorio.')
    .isInt({ min: 1, max: 500000000 })
    .withMessage('El valor de compra debe ser un monto entero positivo mayor a $0 (sin valores negativos).')
];

export const modificarEquipoSchema = [
  body('nombre')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre del equipo no puede quedar vacío.')
    .isLength({ min: 3, max: 60 }).withMessage('El nombre del equipo debe tener entre 3 y 60 caracteres.')
    .custom(exigirLetras('El nombre del equipo', 2)),

  body('marca')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 40 }).withMessage('La marca debe tener entre 2 y 40 caracteres.')
    .custom(exigirLetras('La marca', 2)),

  body('modelo')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 40 }).withMessage('El modelo debe tener entre 2 y 40 caracteres.')
    .custom(exigirLetras('El modelo', 1)),

  body('fecha_compra')
    .optional()
    .custom(validarFechaCompraNoFutura),

  body('valor_compra')
    .optional()
    .notEmpty().withMessage('El valor de compra no puede quedar vacío.')
    .isInt({ min: 1, max: 500000000 })
    .withMessage('El valor de compra debe ser un monto entero positivo mayor a $0 (sin valores negativos).')
];

export const bajaEquipoSchema = [
  body('motivo')
    .trim()
    .notEmpty().withMessage('Debes indicar el motivo para dar de baja el equipo.')
    .isString().withMessage('El motivo debe ser un texto válido.')
    .isLength({ min: 5, max: 150 }).withMessage('El motivo de baja debe tener entre 5 y 150 caracteres.')
    .custom(exigirLetras('El motivo de baja', 3))
];