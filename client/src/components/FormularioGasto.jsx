import { useState } from 'react';
import { TIPOS } from './finanzas/formato.js'; // Corrección 1: Ruta ajustada
import { urlEvidencia } from '../services/gastoEvento.service.js';


// fromulario para registrar o modificar un gasto, con validaciones y manejo de errores


export default function FormularioGasto({ gasto, trabajadores, onGuardar, onCancelar }) {
  const editando = Boolean(gasto);
  const [tipo, setTipo] = useState(gasto?.tipo_gasto ?? 'MOVILIZACION');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      await onGuardar(new FormData(e.currentTarget)); // toma todos los campos por su name
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <form className="fin-form" onSubmit={enviar}>
      {error && <div className="fin-alerta">{error}</div>}

      <div className="fin-campo">
        <label htmlFor="id_trabajador">Trabajador</label>
        <select id="id_trabajador" name="id_trabajador" required defaultValue={gasto?.asignacion?.id_trabajador ?? ''}>
          <option value="">Selecciona un trabajador</option>
          {/* Corrección 3: Agregado el signo de interrogación por si trabajadores llega vacío al principio */}
          {trabajadores?.map((t) => (
            <option key={t.id_trabajador} value={t.id_trabajador}>{t.trabajador}</option>
          ))}
        </select>
      </div>

      <div className="fin-form-fila">
        <div className="fin-campo">
          <label htmlFor="tipo_gasto">Tipo de gasto</label>
          <select id="tipo_gasto" name="tipo_gasto" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {/* Corrección 2: Agregado (TIPOS || {}) para evitar el quiebre de pantalla blanca */}
            {Object.entries(TIPOS || {}).map(([valor, texto]) => (
              <option key={valor} value={valor}>{texto}</option>
            ))}
          </select>
        </div>
        <div className="fin-campo">
          <label htmlFor="monto">Monto (CLP)</label>
          <input id="monto" name="monto" type="number" min="1" step="1" required defaultValue={gasto?.monto ?? ''} />
        </div>
      </div>

      <div className="fin-campo">
        <label htmlFor="fecha">Fecha</label>
        <input
          id="fecha"
          name="fecha"
          type="date"
          required
          defaultValue={gasto ? String(gasto.fecha).slice(0, 10) : new Date().toLocaleDateString('sv-SE')}
        />
      </div>

      {tipo === 'MOVILIZACION' && (
        <div className="fin-form-fila">
          <div className="fin-campo">
            <label htmlFor="origen">Origen</label>
            <input id="origen" name="origen" required maxLength={80} defaultValue={gasto?.origen ?? ''} />
          </div>
          <div className="fin-campo">
            <label htmlFor="destino">Destino</label>
            <input id="destino" name="destino" required maxLength={80} defaultValue={gasto?.destino ?? ''} />
          </div>
        </div>
      )}

      <div className="fin-campo">
        <label htmlFor="descripcion">Descripción</label>
        <textarea id="descripcion" name="descripcion" rows={2} maxLength={255} required={tipo === 'OTRO'} defaultValue={gasto?.descripcion ?? ''} />
      </div>

      <div className="fin-campo">
        <label htmlFor="evidencia">Evidencia (JPG, PNG o PDF){editando && ' · opcional, reemplaza la actual'}</label>
        <input id="evidencia" name="evidencia" type="file" accept=".jpg,.jpeg,.png,.pdf" required={!editando} />
        {editando && (
          <a className="fin-enlace fin-enlace-chico" href={urlEvidencia(gasto.evidencia)} target="_blank" rel="noreferrer">
            Ver evidencia actual
          </a>
        )}
      </div>

      {editando && (
        <div className="fin-campo">
          <label htmlFor="motivo">Motivo del cambio</label>
          <input id="motivo" name="motivo" required maxLength={255} />
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