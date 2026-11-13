import { useEffect, useState } from 'react';
import { clp } from './formato';
import { verRentabilidad } from '../../services/rentabilidad.service.js';

export default function PanelRentabilidad({ idEvento }) {
  const [r, setR] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    verRentabilidad(idEvento)
      .then((d) => {
        setR(d);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [idEvento]);

  return (
    <>
      {error && <div className="fin-alerta">{error}</div>}

      {r && (
        <section className="fin-panel">
          <div className="fin-panel-cab">
            <strong className="fin-panel-titulo">Rentabilidad del evento</strong>
            <span className={`fin-estado fin-estado-${r.tipo === 'GANANCIA' ? 'ganancia' : 'perdida'}`}>
              {r.tipo === 'GANANCIA' ? 'Ganancia' : 'Pérdida'}{r.definitiva ? ' · definitiva' : ''}
            </span>
          </div>

          <div className="fin-resultado">
            {/* Reemplazamos "Pagos del cliente" por "Precio acordado" */}
            <div className="fin-linea"><span>Precio acordado del evento</span><span>{clp(r.precio_acordado)}</span></div>
            <div className="fin-linea"><span>Aportes de auspiciadores</span><span>{clp(r.aportes_auspiciadores)}</span></div>
            <div className="fin-linea"><span>Remuneraciones</span><span>− {clp(r.remuneraciones)}</span></div>
            <div className="fin-linea"><span>Gastos del evento</span><span>− {clp(r.gastos)}</span></div>
            <div className="fin-linea"><span>Pérdidas de inventario</span><span>− {clp(r.perdidas_inventario)}</span></div>
            <div className="fin-linea fin-linea-total"><span>Resultado</span><span>{clp(r.resultado)}</span></div>
          </div>

          <p className="fin-texto-suave" style={{ marginTop: 16 }}>
            {r.definitiva
              ? 'La jornada está cerrada: este resultado quedó fijo.'
              : 'Se actualiza con cada cambio en los montos y queda fijo al cerrar la jornada.'}
          </p>
        </section>
      )}
    </>
  );
}