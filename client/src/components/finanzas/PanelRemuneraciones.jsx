import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { clp } from './formato';
import { listarRemuneraciones, definirPorcentaje } from '../../services/remuneracion.service.js';

// Igual que el back: porcentaje × precio, redondeado al peso
const calcularMonto = (porcentaje, precio) =>
  Math.floor((Math.round(porcentaje * 100) * precio + 5000) / 10000);

// Texto escrito -> número (acepta coma decimal); null si está vacío o no es un número
const leer = (texto) => {
  const t = String(texto).trim().replace(',', '.');
  return t === '' || Number.isNaN(Number(t)) ? null : Number(t);
};

export default function PanelRemuneraciones({ idEvento, idDueno, puedeEditar }) {
  const [datos, setDatos] = useState(null);
  const [escrito, setEscrito] = useState({}); // lo que el Dueño cambió, por asignación
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

  const precio = datos?.precio_acordado ?? 0;
  const editable = puedeEditar && datos?.editable;

  // Lo que se muestra de cada trabajador: lo que escribió, lo ya guardado o, si no hay nada, el porcentaje del rol
  const filas = (datos?.asignaciones ?? []).map((a) => {
    const cambiado = escrito[a.id_asignacion] !== undefined;
    const texto = String(escrito[a.id_asignacion] ?? a.porcentaje ?? a.porcentaje_referencial ?? '');
    return {
      ...a,
      texto,
      valor: leer(texto),
      sugerido: !cambiado && a.porcentaje === null && a.porcentaje_referencial !== null, // aún sin guardar
      pendiente: cambiado || (a.porcentaje === null && a.porcentaje_referencial !== null),
    };
  });

  // Resumen con lo que se ve en pantalla
  const porcentajeRepartido = Math.round(filas.reduce((s, f) => s + (f.valor ?? 0), 0) * 100) / 100;
  const montoRepartido = filas.reduce((s, f) => s + (f.valor === null ? 0 : calcularMonto(f.valor, precio)), 0);

  async function guardar(f) {
    try {
      await definirPorcentaje(f.id_asignacion, { id_dueno: idDueno, porcentaje: f.valor });
      setEscrito((e) => {
        const copia = { ...e };
        delete copia[f.id_asignacion];
        return copia;
      });
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e.message); // el back explica, por ejemplo, el máximo permitido
    }
  }

  return (
    <>
      {error && <div className="fin-alerta">{error}</div>}

      {datos && (
        <section className="fin-panel">
          <div className="fin-panel-cab">
            <strong className="fin-panel-titulo">Porcentajes del evento · {clp(precio)}</strong>
            <span className="fin-contador">
              Queda para la empresa: {clp(precio - montoRepartido)} ({Math.round((100 - porcentajeRepartido) * 100) / 100}%)
            </span>
          </div>

          {filas.length === 0 ? (
            <p className="fin-vacio">Este evento no tiene trabajadores asignados</p>
          ) : (
            <div className="fin-grid">
              {filas.map((f) => (
                <article key={f.id_asignacion} className="fin-card">
                  <div className="fin-card-cab">
                    <span className="fin-avatar">{f.trabajador.charAt(0).toUpperCase()}</span>
                    <div className="fin-card-titulo">
                      <strong>{f.trabajador}</strong>
                      <span className="fin-sub">{f.rol}</span>
                    </div>
                    <span className="fin-monto">{f.valor === null ? '—' : clp(calcularMonto(f.valor, precio))}</span>
                  </div>

                  <div className="fin-campo">
                    <label htmlFor={`pct-${f.id_asignacion}`}>Porcentaje del precio</label>
                    <div className="fin-pct-campo">
                      <input
                        id={`pct-${f.id_asignacion}`}
                        type="text"
                        inputMode="decimal"
                        disabled={!editable}
                        value={f.texto}
                        onChange={(e) => setEscrito({ ...escrito, [f.id_asignacion]: e.target.value })}
                      />
                      <span>%</span>
                    </div>
                    {f.sugerido && <span className="fin-pct-ayuda">Sugerido por el rol · aún sin guardar</span>}
                  </div>

                  {editable && (
                    <div className="fin-card-pie">
                      {f.porcentaje_referencial !== null && f.texto !== String(f.porcentaje_referencial) ? (
                        <button
                          type="button"
                          className="fin-enlace fin-enlace-boton"
                          onClick={() => setEscrito({ ...escrito, [f.id_asignacion]: String(f.porcentaje_referencial) })}
                        >
                          Sugerido: {f.porcentaje_referencial}%
                        </button>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        className="fin-btn fin-btn-primario fin-btn-chico"
                        disabled={!f.pendiente || f.valor === null}
                        onClick={() => guardar(f)}
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