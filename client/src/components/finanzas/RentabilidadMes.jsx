import { useEffect, useState } from 'react';
import Modal from '../Modal';
import { clp, formatearFecha } from './formato';
import { obtenerUsuario } from '../../services/http.js';
import { listarRentabilidadMes, verMovimientos } from '../../services/rentabilidad.service.js';

export default function RentabilidadMes() {
  const rol = String(obtenerUsuario()?.rol ?? '').toUpperCase();
  const permitido = rol === 'DUENO' || rol === 'CONTADOR';

  const [mes, setMes] = useState(new Date().toLocaleDateString('sv-SE').slice(0, 7)); // AAAA-MM
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [detalle, setDetalle] = useState(null); // { evento, movimientos }
  const [errorDetalle, setErrorDetalle] = useState('');

  useEffect(() => {
    if (!permitido || !mes) return;
    const [anio, numero] = mes.split('-');
    listarRentabilidadMes(anio, Number(numero))
      .then((d) => {
        setDatos(d);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [mes, permitido]);

  async function abrir(evento) {
    setDetalle({ evento, movimientos: null });
    setErrorDetalle('');
    try {
      const d = await verMovimientos(evento.id_evento);
      setDetalle({ evento, movimientos: d.movimientos });
    } catch (e) {
      setErrorDetalle(e.message);
    }
  }

  // Solo el Dueño y el Contador ven datos financieros
  if (!permitido) {
    return <div className="fin-alerta fin-alerta-info">Solo el Dueño y el Contador ven la rentabilidad.</div>;
  }

  return (
    <>
      {error && <div className="fin-alerta">{error}</div>}

      <section className="fin-filtros">
        <div className="fin-campo fin-filtro">
          <label htmlFor="mes">Mes</label>
          <input id="mes" type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
        </div>
      </section>

      {datos && (
        <section className="fin-panel">
          <div className="fin-panel-cab">
            <strong className="fin-panel-titulo">Eventos del mes</strong>
            <span className="fin-contador">
              {datos.totales.ganancias} con ganancia · {datos.totales.perdidas} con pérdida
            </span>
          </div>

          <div className="fin-resultado" style={{ marginTop: 0, marginBottom: 16 }}>
            <div className="fin-linea"><span>Ingresos del mes</span><span>{clp(datos.totales.ingresos)}</span></div>
            <div className="fin-linea"><span>Costos del mes</span><span>− {clp(datos.totales.costos)}</span></div>
            <div className="fin-linea fin-linea-total"><span>Resultado del mes</span><span>{clp(datos.totales.resultado)}</span></div>
          </div>

          {datos.eventos.length === 0 ? (
            <p className="fin-vacio">No hay eventos realizados en este mes</p>
          ) : (
            <div className="fin-grid">
              {datos.eventos.map((e) => (
                <article key={e.id_evento} className="fin-card">
                  <div className="fin-card-cab">
                    <div className="fin-card-titulo">
                      <strong>{e.tipo_evento}</strong>
                      <span className="fin-sub">{formatearFecha(e.fecha)} · {e.cliente}</span>
                    </div>
                    <span className="fin-monto">{clp(e.resultado)}</span>
                  </div>

                  <div className="fin-detalle">
                    <span>Ingresos: {clp(e.ingresos)}</span>
                    <span>Costos: {clp(e.costos)}</span>
                  </div>

                  <div className="fin-card-pie">
                    <span className={`fin-estado fin-estado-${e.tipo === 'GANANCIA' ? 'ganancia' : 'perdida'}`}>
                      {e.tipo === 'GANANCIA' ? 'Ganancia' : 'Pérdida'}{e.definitiva ? ' · definitiva' : ''}
                    </span>
                    <button type="button" className="fin-btn fin-btn-chico" onClick={() => abrir(e)}>
                      Ver detalle
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <Modal
        abierto={Boolean(detalle)}
        onCerrar={() => setDetalle(null)}
        titulo={detalle ? `Movimientos · ${detalle.evento.tipo_evento} ${formatearFecha(detalle.evento.fecha)}` : ''}
        ancho="amplio"
      >
        {errorDetalle && <div className="fin-alerta">{errorDetalle}</div>}
        {detalle?.movimientos && (
          detalle.movimientos.length === 0 ? (
            <p className="fin-vacio">Este evento no tiene movimientos</p>
          ) : (
            <div className="fin-resultado" style={{ marginTop: 0 }}>
              {detalle.movimientos.map((m, i) => (
                <div key={i} className="fin-linea">
                  <span>{formatearFecha(m.fecha)} · {m.concepto} — {m.detalle}</span>
                  <span>{m.tipo === 'INGRESO' ? '+' : '−'} {clp(m.monto)}</span>
                </div>
              ))}
            </div>
          )
        )}
      </Modal>
    </>
  );
}