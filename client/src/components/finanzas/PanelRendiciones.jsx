import { useEffect, useState } from 'react';
import { Check, Ban } from 'lucide-react';
import { listarRendiciones, marcarRendicion } from '../../services/gastoEvento.service.js';

const TEXTO = { PENDIENTE: 'Pendiente', RENDIDA: 'Rendida', SIN_GASTOS: 'Sin gastos' };
const CLASE = { PENDIENTE: 'pendiente', RENDIDA: 'rendida', SIN_GASTOS: 'sin-gastos' };

export default function PanelRendiciones({ idEvento, idContador, puedeEditar }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    listarRendiciones(idEvento)
      .then((d) => {
        setDatos(d);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [idEvento, version]);

  async function marcar(r, estado) {
    try {
      await marcarRendicion(r.id_asignacion, { id_contador: idContador, estado_rendicion: estado });
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      {error && <div className="fin-alerta">{error}</div>}

      {datos && (
        <section className="fin-panel">
          <div className="fin-panel-cab">
            <strong className="fin-panel-titulo">Rendiciones del evento</strong>
            <span className="fin-contador">Faltan {datos.resumen.pendientes} por rendir</span>
          </div>

          {datos.rendiciones.length === 0 ? (
            <p className="fin-vacio">Este evento no tiene trabajadores asignados</p>
          ) : (
            <div className="fin-grid">
              {datos.rendiciones.map((r) => (
                <article key={r.id_asignacion} className="fin-card">
                  <div className="fin-card-cab">
                    <span className="fin-avatar">{r.trabajador.charAt(0).toUpperCase()}</span>
                    <div className="fin-card-titulo">
                      <strong>{r.trabajador}</strong>
                      <span className="fin-sub">{r.rol} · {r.cantidad_gastos} gastos</span>
                    </div>
                    <span className={`fin-estado fin-estado-${CLASE[r.estado_rendicion]}`}>{TEXTO[r.estado_rendicion]}</span>
                  </div>

                  {puedeEditar && r.estado_rendicion === 'PENDIENTE' && (
                    <div className="fin-card-pie">
                      {r.cantidad_gastos > 0 ? (
                        <button type="button" className="fin-btn fin-btn-primario fin-btn-chico" onClick={() => marcar(r, 'RENDIDA')}>
                          <Check size={15} /> Marcar como rendida
                        </button>
                      ) : (
                        <button type="button" className="fin-btn fin-btn-chico" onClick={() => marcar(r, 'SIN_GASTOS')}>
                          <Ban size={15} /> Marcar sin gastos
                        </button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}