import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { clp } from './formato.js';
import { listarRemuneraciones, definirPorcentaje } from '../../services/remuneracion.service.js';


//seccion remuneraciones...


export default function PanelRemuneraciones({ idEvento, idDueno, puedeEditar }) {
  const [datos, setDatos] = useState(null);
  const [escrito, setEscrito] = useState({}); // porcentaje que el Dueño va escribiendo, por asignación
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    listarRemuneraciones(idEvento)
      .then((d) => {
        setDatos(d);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [idEvento, version]);

  async function guardar(a) {
    try {
      await definirPorcentaje(a.id_asignacion, { id_dueno: idDueno, porcentaje: escrito[a.id_asignacion] });
      setEscrito((e) => {
        const copia = { ...e };
        delete copia[a.id_asignacion];
        return copia;
      });
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e.message); // el back explica, por ejemplo, el máximo permitido
    }
  }

  const editable = puedeEditar && datos?.editable;

  return (
    <>
      {error && <div className="fin-alerta">{error}</div>}
      {datos && !datos.editable && (
        <div className="fin-alerta fin-alerta-info">
          Los porcentajes se definen con el evento Realizado y antes de cerrar la jornada.
        </div>
      )}

      {datos && (
        <section className="fin-panel">
          <div className="fin-panel-cab">
            <strong className="fin-panel-titulo">Porcentajes del evento · {clp(datos.precio_acordado)}</strong>
            <span className="fin-contador">
              Queda para la empresa: {clp(datos.resumen.queda_empresa_monto)} ({datos.resumen.queda_empresa_porcentaje}%)
            </span>
          </div>

          {datos.asignaciones.length === 0 ? (
            <p className="fin-vacio">Este evento no tiene trabajadores asignados</p>
          ) : (
            <div className="fin-grid">
              {datos.asignaciones.map((a) => (
                <article key={a.id_asignacion} className="fin-card">
                  <div className="fin-card-cab">
                    <span className="fin-avatar">{a.trabajador.charAt(0).toUpperCase()}</span>
                    <div className="fin-card-titulo">
                      <strong>{a.trabajador}</strong>
                      <span className="fin-sub">{a.rol}</span>
                    </div>
                    <span className="fin-monto">{a.remuneracion === null ? '—' : clp(a.remuneracion)}</span>
                  </div>

                  <div className="fin-campo">
                    <label htmlFor={`pct-${a.id_asignacion}`}>Porcentaje del precio</label>
                    <div className="fin-pct-campo">
                      <input
                        id={`pct-${a.id_asignacion}`}
                        type="text"
                        inputMode="decimal"
                        disabled={!editable}
                        value={escrito[a.id_asignacion] ?? a.porcentaje ?? ''}
                        onChange={(e) => setEscrito({ ...escrito, [a.id_asignacion]: e.target.value })}
                      />
                      
                    </div>
                  </div>

                  {editable && (
                    <div className="fin-card-pie">
                      {a.porcentaje_referencial !== null ? (
                        <button
                          type="button"
                          className="fin-enlace fin-enlace-boton"
                          onClick={() => setEscrito({ ...escrito, [a.id_asignacion]: String(a.porcentaje_referencial) })}
                        >
                          Sugerido: {a.porcentaje_referencial}%
                        </button>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        className="fin-btn fin-btn-primario fin-btn-chico"
                        disabled={escrito[a.id_asignacion] === undefined}
                        onClick={() => guardar(a)}
                      >
                        <Check size={15} /> Guardar
                      </button>
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