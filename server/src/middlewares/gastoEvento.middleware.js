import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { manejarError, ValidationError } from '../utils/errores.js';

const CARPETA = 'uploads/evidencias'; // Carpeta donde se guardarán las evidencias de gastos, variable tipo constante, para que no se repita en varios lugares y se pueda cambiar fácilmente.
fs.mkdirSync(CARPETA, { recursive: true });// si no existe, se crea la carpeta, si existe, no hace nada. recursive: true permite crear subcarpetas si es necesario.

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB el archivo como maximo
const MIMES_PERMITIDOS = ['image/jpeg', 'image/png', 'application/pdf']; //guardamos la naturaleza y el tipo
const EXTENSIONES_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.pdf']; // guardamos las extenciones permitidas
const EXT_POR_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'application/pdf': '.pdf' };

const nombreUnico = (ext) => `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`; // cambia el nombre del archivo
// irrepetible, para que no se sobreescriba

// donde guardaremos el archivo y el nombre que tendra.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CARPETA), // ubicacion y que capeta se guardara, cb: callback
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();//leemos la extencion del archivo y la convertimos a minuscula
    cb(null, nombreUnico(ext)); // guardamos archivo
  },
});

// configuramos multer, con el storage, el limite de tamaño y el filtro de archivos, seguridda
const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if(!MIMES_PERMITIDOS.includes(file.mimetype) || !EXTENSIONES_PERMITIDAS.includes(ext)){
      return cb(new ValidationError('La evidencia debe ser JPG, PNG o PDF', 'evidencia'));
    }
    cb(null, true);
  },
});


const guardarBase64 = (dataUrl) => {
  const m = /^data:([\w/+.-]+);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(String(dataUrl));
  if(!m){
    throw new ValidationError('La evidencia debe ser un archivo o un base64 con formato data:<tipo>;base64,<datos>', 'evidencia');
  }
  const [, mime, datos] = m;
  if(!MIMES_PERMITIDOS.includes(mime)){
    throw new ValidationError('La evidencia debe ser JPG, PNG o PDF', 'evidencia');
  }
  const buffer = Buffer.from(datos, 'base64');
  if(buffer.length === 0){
    throw new ValidationError('La evidencia está vacía', 'evidencia');
  }
  if(buffer.length > MAX_BYTES){
    throw new ValidationError('La evidencia no puede superar los 5 MB', 'evidencia');
  }

  const cabecera = buffer.subarray(0, 4).toString('hex');
  const firmas = { 'image/png': '89504e47', 'image/jpeg': 'ffd8ff', 'application/pdf': '25504446' };
  if(!cabecera.startsWith(firmas[mime])){
    throw new ValidationError('El contenido no corresponde a un archivo válido del tipo indicado', 'evidencia');
  }

  const filename = nombreUnico(EXT_POR_MIME[mime]);
  const ruta = path.join(CARPETA, filename);
  fs.writeFileSync(ruta, buffer);
  return { filename, path: ruta, mimetype: mime, size: buffer.length };
};

export const subirEvidencia = (req, res, next) => {
  const esMultipart = (req.headers['content-type'] || '').startsWith('multipart/form-data');

  if(!esMultipart){
    try{
      if(req.body?.evidencia){
        req.file = guardarBase64(req.body.evidencia);
        delete req.body.evidencia;
      }
      return next();
    }catch (error){
      return manejarError(res, error);
    }
  }

  upload.single('evidencia')(req, res, (err) => {
    if(err){
      if(err instanceof multer.MulterError){
        const mensaje = err.code === 'LIMIT_FILE_SIZE'
          ? 'La evidencia no puede superar los 5 MB'
          : 'Error al subir la evidencia';
        return res.status(400).json({ mensaje, campo: 'evidencia' });
      }
      return manejarError(res, err);
    }
    next();
  });
};