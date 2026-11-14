import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { validarCrearGastoFijo, validarPeriodoQuery } from '../schemas/gastosFijos.schemas.js';
import { manejarError, ValidationError } from '../utils/errores.js';

// Asegurar que exista la carpeta uploads/gastos-fijos
const carpetaDestino = 'uploads/gastos-fijos';
if (!fs.existsSync(carpetaDestino)) {
  fs.mkdirSync(carpetaDestino, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, carpetaDestino),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `gasto-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Máximo 5 MB
  fileFilter: (_req, file, cb) => {
    const permitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (permitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Solo se permiten archivos PDF, JPG, PNG o WEBP', 'evidencia'));
    }
  },
});

// Middleware 1: procesa el archivo adjunto opcional (campo "evidencia")
export const subirEvidenciaGastoFijo = (req, res, next) => {
  upload.single('evidencia')(req, res, (err) => {
    if (err) {
      return manejarError(res, err);
    }
    next();
  });
};

// Middleware 2: valida los datos del body e inyecta la ruta del archivo si se subió
export const verificarCrearGastoFijo = (req, res, next) => {
  try {
    const datosValidados = validarCrearGastoFijo(req.body);
    if (req.file) {
      datosValidados.evidencia = `/uploads/gastos-fijos/${req.file.filename}`;
    }
    req.body = datosValidados;
    next();
  } catch (error) {
    return manejarError(res, error);
  }
};

export const verificarPeriodoCierre = (req, res, next) => {
  try {
    req.periodo = validarPeriodoQuery(req.query);
    next();
  } catch (error) {
    return manejarError(res, error);
  }
};