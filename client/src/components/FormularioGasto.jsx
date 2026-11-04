import { useState } from 'react';
import { Paperclip } from 'lucide-react';

const EXTENSIONES = ['jpg', 'jpeg', 'png', 'pdf'];
const MAX_MB = 5;

/**
 * Formulario para registrar o editar un gasto. Va dentro de <Modal>.
 * - gasto: null para crear, o el gasto a editar
 * - onGuardar(formData): el padre agrega id_contador / id_evento y llama al back
 */
export default function FormularioGasto({ gasto, trabajadores, tipos, onGuardar, onCancelar }) {
  const editando = Boolean(gasto);

  const [datos, setDatos] = useState(() => ({
    id_trabajador: gasto ? String(gasto.asignacion.id_trabajador) : '',
    tipo_gasto: gasto?.tipo_gasto ?? 'MOVILIZACION',
    monto: gasto ? String(gasto.monto) : '',
    fecha: gasto ? String(gasto.fecha).slice(0, 10) : new Date().toLocaleDateString('sv-SE'),
    descripcion: gasto?.descripcion ?? '',
    origen: gasto?.origen ?? '',
    destino: gasto?.destino ?? '',
    motivo: '',
  }));
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  function elegirArchivo(e) {
    const f = e.target.files[0];
    if (!f) return setArchivo(null);
    const ext = f.name.split('.').pop().toLowerCase();
    if (!EXTENSIONES.includes(ext)) {
      e.target.value = '';
      return setError('La evidencia debe ser JPG, PNG o PDF');
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      e.target.value = '';
      return setError(`La evidencia no puede superar los ${MAX_MB} MB`);
    }
    setError('');
    setArchivo(f);
  }

  function validar() {
    if (!datos.id_trabajador) return 'Selecciona el trabajador';
    const monto = Number(datos.monto);
    if (!Number.isInteger(monto) || monto <= 0) return 'El monto debe ser un número entero mayor a 0';
    if (!datos.fecha) return 'Indica la fecha del gasto';
    if (datos.tipo_gasto === 'MOVILIZACION' && (!datos.origen.trim() || !datos.destino.trim())) {
      return 'En movilización debes indicar origen y destino';
    }
    if (datos.tipo_gasto === 'OTRO' && !datos.descripcion.trim()) {
      return 'Describe el gasto de tipo Otro';
    }
    if (!editando && !archivo) return 'Adjunta la evidencia (JPG, PNG o PDF)';
    if (editando && !datos.motivo.trim()) return 'Indica el motivo del cambio';
    return '';
  }

  async function enviar(e) {
    e.preventDefault();
    const problema = validar();
    if (problema) return setError(problema);

    const fd = new FormData();
    fd.append('id_trabajador', datos.id_trabajador);
    fd.append('tipo_gasto', datos.tipo_gasto);
    fd.append('monto', datos.monto);
    fd.append('fecha', datos.fecha);
    fd.append('descripcion', datos.descripcion);
    if (datos.tipo_gasto === 'MOVILIZACION') {
      fd.append('origen', datos.origen);
      fd.append('destino', datos.destino);
    }
    if (editando) fd.append('motivo', datos.motivo);
    if (archivo) fd.append('evidencia', archivo);

    setEnviando(true);
    setError('');
    try {
      await onGuardar(fd); // si sale bien, el padre cierra el modal
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <form className="fin-form" onSubmit={enviar} noValidate>
      {error && <div className="fin-alerta">{error}</div>}

      <div className="fin-campo">
        <label htmlFor="id_trabajador">Trabajador</label>
        <select id="id_trabajador" name="id_trabajador" value={datos.id_trabajador} onChange={cambiar}>
          <option value="">Selecciona un trabajador</option>
          {trabajadores.map((t) => (
            <option key={t.id_trabajador} value={t.id_trabajador}>
              {t.trabajador}
            </option>
          ))}
        </select>
      </div>

      <div className="fin-form-fila">
        <div className="fin-campo">
          <label htmlFor="tipo_gasto">Tipo de gasto</label>
          <select id="tipo_gasto" name="tipo_gasto" value={datos.tipo_gasto} onChange={cambiar}>
            {Object.entries(tipos).map(([valor, texto]) => (
              <option key={valor} value={valor}>{texto}</option>
            ))}
          </select>
        </div>
        <div className="fin-campo">
          <label htmlFor="monto">Monto (CLP)</label>
          <input id="monto" name="monto" type="number" min="1" step="1" value={datos.monto} onChange={cambiar} placeholder="5000" />
        </div>
      </div>

      <div className="fin-campo">
        <label htmlFor="fecha">Fecha</label>
        <input id="fecha" name="fecha" type="date" value={datos.fecha} onChange={cambiar} />
      </div>

      {datos.tipo_gasto === 'MOVILIZACION' && (
        <div className="fin-form-fila">
          <div className="fin-campo">
            <label htmlFor="origen">Origen</label>
            <input id="origen" name="origen" maxLength={80} value={datos.origen} onChange={cambiar} placeholder="Los Ángeles" />
          </div>
          <div className="fin-campo">
            <label htmlFor="destino">Destino</label>
            <input id="destino" name="destino" maxLength={80} value={datos.destino} onChange={cambiar} placeholder="Estadio Municipal" />
          </div>
        </div>
      )}

      <div className="fin-campo">
        <label htmlFor="descripcion">Descripción {datos.tipo_gasto !== 'OTRO' && <span className="fin-opcional">(opcional)</span>}</label>
        <textarea id="descripcion" name="descripcion" rows={2} maxLength={255} value={datos.descripcion} onChange={cambiar} placeholder="Ej: Taxi al estadio" />
      </div>

      <div className="fin-campo">
        <label htmlFor="evidencia">
          Evidencia (JPG, PNG o PDF) {editando && <span className="fin-opcional">(opcional, reemplaza la actual)</span>}
        </label>
        <input id="evidencia" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={elegirArchivo} />
        {editando && (
          <a className="fin-enlace fin-enlace-chico" href={`/${gasto.evidencia}`} target="_blank" rel="noreferrer">
            <Paperclip size={14} /> Ver evidencia actual
          </a>
        )}
      </div>

      {editando && (
        <div className="fin-campo">
          <label htmlFor="motivo">Motivo del cambio</label>
          <input id="motivo" name="motivo" maxLength={255} value={datos.motivo} onChange={cambiar} placeholder="Ej: Monto mal digitado" />
        </div>
      )}

      <div className="fin-form-pie">
        <button type="button" className="fin-btn" onClick={onCancelar} disabled={enviando}>Cancelar</button>
        <button type="submit" className="fin-btn fin-btn-primario" disabled={enviando}>
          {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar gasto'}
        </button>
      </div>
    </form>
  );
}