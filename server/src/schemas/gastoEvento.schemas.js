import { ValidationError } from '../utils/errores.js';

export const TIPOS_GASTO = ['MOVILIZACION', 'PEAJE', 'PASAJE', 'ALIMENTACION', 'OTRO'];

const entero = (valor, campo, { positivo = true } = {}) => {
  const n = Number(valor);
  if(valor === '' || valor === null || valor === undefined || !Number.isInteger(n) || (positivo && n <= 0)){
    throw new ValidationError(`El campo ${campo} no es válido`, campo);
  }
  return n;
};

const fechaDate = (valor) => {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(valor))){
    throw new ValidationError('La fecha debe tener formato AAAA-MM-DD', 'fecha');
  }
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  if(Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor){
    throw new ValidationError('La fecha no es válida', 'fecha');
  }
  return fecha;
};

const texto = (valor, campo, max) => {
  if(valor === undefined || valor === null) return null;
  const t = String(valor).trim();
  if(t === '') return null;
  if(t.length > max){
    throw new ValidationError(`El campo ${campo} no puede superar ${max} caracteres`, campo);
  }
  return t;
};

const tipoGasto = (valor) => {
  if(!TIPOS_GASTO.includes(valor)){
    throw new ValidationError(`tipo_gasto debe ser uno de: ${TIPOS_GASTO.join(', ')}`, 'tipo_gasto');
  }
  return valor;
};

// Regla común: movilización exige origen y destino; los demás tipos no los guardan
const origenDestino = (tipo, body) => {
  if(tipo !== 'MOVILIZACION') return { origen: null, destino: null };
  const origen = texto(body.origen, 'origen', 80);
  const destino = texto(body.destino, 'destino', 80);
  if(!origen) throw new ValidationError('El origen es obligatorio para movilización', 'origen');
  if(!destino) throw new ValidationError('El destino es obligatorio para movilización', 'destino');
  return { origen, destino };
};

// RF-P7-02
export const validarCrearGasto = (body, file) => {
  if(!file){
    throw new ValidationError('La evidencia (JPG, PNG o PDF) es obligatoria', 'evidencia');
  }
  const tipo_gasto = tipoGasto(body.tipo_gasto);
  const descripcion = texto(body.descripcion, 'descripcion', 255);
  if(tipo_gasto === 'OTRO' && !descripcion){
    throw new ValidationError('La descripción es obligatoria para gastos de tipo OTRO', 'descripcion');
  }

  return {
    id_contador: entero(body.id_contador, 'id_contador'),
    id_evento: entero(body.id_evento, 'id_evento'),
    id_trabajador: entero(body.id_trabajador, 'id_trabajador'),
    tipo_gasto,
    monto: entero(body.monto, 'monto'),
    fecha: fechaDate(body.fecha),
    descripcion,
    ...origenDestino(tipo_gasto, body),
    evidencia: `uploads/evidencias/${file.filename}`,
  };
};

// RF-P7-03 (modificar): todo es opcional salvo id_contador y motivo
export const validarModificarGasto = (body, file) => {
  const motivo = texto(body.motivo, 'motivo', 255);
  if(!motivo) throw new ValidationError('El motivo del cambio es obligatorio', 'motivo');

  const datos = {
    id_contador: entero(body.id_contador, 'id_contador'),
    motivo,
  };

  if(body.id_trabajador !== undefined) datos.id_trabajador = entero(body.id_trabajador, 'id_trabajador');
  if(body.tipo_gasto !== undefined) datos.tipo_gasto = tipoGasto(body.tipo_gasto);
  if(body.monto !== undefined) datos.monto = entero(body.monto, 'monto');
  if(body.fecha !== undefined) datos.fecha = fechaDate(body.fecha);
  if(body.descripcion !== undefined) datos.descripcion = texto(body.descripcion, 'descripcion', 255);
  if(body.origen !== undefined) datos.origen = texto(body.origen, 'origen', 80);
  if(body.destino !== undefined) datos.destino = texto(body.destino, 'destino', 80);
  if(file) datos.evidencia = `uploads/evidencias/${file.filename}`;

  return datos;
};

export const validarEliminarGasto = (body) => {
  const motivo = texto(body.motivo, 'motivo', 255);
  if(!motivo) throw new ValidationError('El motivo de la eliminación es obligatorio', 'motivo');
  return { id_contador: entero(body.id_contador, 'id_contador'), motivo };
};

export { origenDestino };