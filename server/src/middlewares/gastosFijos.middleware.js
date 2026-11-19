import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  validarCrearGastoFijo,
  validarActualizarGastoFijo,
  validarPeriodoQuery,
} from '../schemas/gastosFijos.schemas.js';
import { manejarError, ValidationError } from '../utils/errores.js';

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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const permitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (permitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Solo se permiten archivos PDF, JPG, PNG o WEBP', 'evidencia'));
    }
  },
});

export const subirEvidenciaGastoFijo = (req, res, next) => {
  upload.single('evidencia')(req, res, (err) => {
    if (err) {
      return manejarError(res, err);
    }
    next();
  });
};

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

export const verificarActualizarGastoFijo = (req, res, next) => {
  try {
    const datosValidados = validarActualizarGastoFijo(req.body);
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