import { useEffect, useState } from 'react';
import Modal from '../Modal.jsx';
import { clp, formatearFecha } from './formato.js';
import { listarPagos, registrarPago } from '../../services/pagoRemuneracion.service.js';

const MEDIOS = ['Transferencia', 'Efectivo', 'Otro'];

export default function PanelPagos({ idEvento, idContador, puedeEditar }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [pagando, setPagando] = useState(null); // la fila a la que se le registra el pago
  const [form, setForm] = useState({ fecha: '', monto: '', medio_pago: 'Transferencia' });
  const [advertir, setAdvertir] = useState(false);
  const [errorPago, setErrorPago] = useState('');

  useEffect(() => {
    listarPagos(idEvento)
      .then((d) => {
        setDatos(d);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [idEvento, version]);

  function abrir(p) {
    // El monto viene con la remuneración calculada, y el Contador lo cambia si pagó otro
    setForm({ fecha: new Date().toLocaleDateString('sv-SE'), monto: String(p.remuneracion), medio_pago: 'Transferencia' });
    setAdvertir(false);
    setErrorPago('');
    setPagando(p);
  }

  const cambiar = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setAdvertir(false);
  };

  async function enviar(e) {
    e.preventDefault();
    // Monto distinto del calculado: primero se avisa, y se registra en el segundo clic
    if (Number(form.monto) !== pagando.remuneracion && !advertir) return setAdvertir(true);
    try {
      await registrarPago(pagando.id_asignacion, { id_contador: idContador, ...form, confirmar: true });
      setPagando(null);
      setVersion((v) => v + 1);
    } catch (err) {
      setErrorPago(err.message);
    }
  }

  return (
    <>
      {error && <div className="fin-alerta">{error}</div>}
      {datos && !datos.puede_pagar && (
        <div className="fin-alerta fin-alerta-info">Los pagos se registran cuando la jornada está cerrada.</div>
      )}

      {datos && (
        <section className="fin-panel">
          <div className="fin-panel-cab">
            <strong className="fin-panel-titulo">Pago de remuneraciones</strong>
            <span className="fin-contador">
              Por pagar: {datos.resumen.por_pagar} ({clp(datos.resumen.monto_por_pagar)})
            </span>
          </div>

          {datos.pagos.length === 0 ? (
            <p className="fin-vacio">Este evento no tiene trabajadores asignados</p>
          ) : (
            <div className="fin-grid">
              {datos.pagos.map((p) => (
                <article key={p.id_asignacion} className="fin-card">
                  <div className="fin-card-cab">
                    <span className="fin-avatar">{p.trabajador.charAt(0).toUpperCase()}</span>
                    <div className="fin-card-titulo">
                      <strong>{p.trabajador}</strong>
                      <span className="fin-sub">{p.rol}</span>
                    </div>
                    <span className="fin-monto">{p.remuneracion === null ? '—' : clp(p.remuneracion)}</span>
                  </div>

                  <div className="fin-detalle">
                    {p.pago ? (
                      <>
                        <span>Pagado el {formatearFecha(p.pago.fecha)} · {p.pago.medio_pago}</span>
                        <span>Monto pagado: {clp(p.pago.monto)}</span>
                      </>
                    ) : (
                      <span>{p.remuneracion ? 'Pendiente de pago' : 'Sin remuneración calculada'}</span>
                    )}
                  </div>

                  <div className="fin-card-pie">
                    <span className={`fin-estado fin-estado-${p.estado_pago === 'PAGADA' ? 'rendida' : 'pendiente'}`}>
                      {p.estado_pago === 'PAGADA' ? 'Pagada' : 'Por pagar'}
                    </span>
                    {puedeEditar && datos.puede_pagar && p.estado_pago === 'POR_PAGAR' && p.remuneracion > 0 && (
                      <button type="button" className="fin-btn fin-btn-primario fin-btn-chico" onClick={() => abrir(p)}>
                        Registrar pago
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <Modal abierto={Boolean(pagando)} onCerrar={() => setPagando(null)} titulo="Registrar pago de remuneración">
        {pagando && (
          <form className="fin-form" onSubmit={enviar}>
            {errorPago && <div className="fin-alerta">{errorPago}</div>}
            <p className="fin-texto-suave">
              Pago a <strong>{pagando.trabajador}</strong>. Remuneración calculada:{' '}
              <strong>{clp(pagando.remuneracion)}</strong>.
            </p>

            <div className="fin-form-fila">
              <div className="fin-campo">
                <label htmlFor="fecha">Fecha</label>
                <input id="fecha" name="fecha" type="date" required value={form.fecha} onChange={cambiar} />
              </div>
              <div className="fin-campo">
                <label htmlFor="monto">Monto (CLP)</label>
                <input id="monto" name="monto" type="number" min="1" step="1" required value={form.monto} onChange={cambiar} />
              </div>
            </div>

            <div className="fin-campo">
              <label htmlFor="medio_pago">Medio de pago</label>
              <select id="medio_pago" name="medio_pago" value={form.medio_pago} onChange={cambiar}>
                {MEDIOS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {advertir && (
              <div className="fin-alerta fin-alerta-info">
                El monto ({clp(Number(form.monto))}) difiere del calculado ({clp(pagando.remuneracion)}).
                Si es correcto, pulsa «Registrar de todos modos».
              </div>
            )}

            <div className="fin-form-pie">
              <button type="button" className="fin-btn" onClick={() => setPagando(null)}>Cancelar</button>
              <button type="submit" className="fin-btn fin-btn-primario">
                {advertir ? 'Registrar de todos modos' : 'Registrar pago'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}