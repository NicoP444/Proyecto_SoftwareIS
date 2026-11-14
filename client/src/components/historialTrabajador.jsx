import { useState } from 'react';
import Modal from './Modal';
import { clp, formatearFecha } from './finanzas/formato';
import { verHistorialTrabajador } from '../services/historialTrabajador.service.js';
import { obtenerUsuario } from '../services/http.js';
import '../styles/Finanzas.css';

export default function HistorialTrabajador({ trabajador }) {
  const rol = String(obtenerUsuario()?.rol ?? '').toUpperCase();
  const [abierto, setAbierto] = useState(false);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  // Solo el Dueño y el Contador ven pagos y remuneraciones
  if (rol !== 'DUENO' && rol !== 'CONTADOR') return null;

  async function abrir() {
    setAbierto(true);
    setDatos(null);
    setError('');
    try {
      setDatos(await verHistorialTrabajador(trabajador.id_trabajador));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="finanzas" style={{ display: 'inline-block' }}>
      <button type="button" className="fin-btn fin-btn-chico" onClick={abrir}>
        Historial
      </button>

      <Modal abierto={abierto} onCerrar={() => setAbierto(false)} titulo={`Historial de ${trabajador.nombre}`} ancho="amplio">
        {error && <div className="fin-alerta">{error}</div>}

        {datos && (
          <>
            <div className="fin-resultado" style={{ marginTop: 0, marginBottom: 16 }}>
              <div className="fin-linea"><span>Eventos en que participó</span><span>{datos.resumen.eventos}</span></div>
              <div className="fin-linea"><span>Total en remuneraciones</span><span>{clp(datos.resumen.total_remuneracion)}</span></div>
              <div className="fin-linea fin-linea-total"><span>Por pagar</span><span>{clp(datos.resumen.por_pagar)}</span></div>
            </div>

            {datos.eventos.length === 0 ? (
              <p className="fin-vacio">Todavía no participó en eventos realizados</p>
            ) : (
              <div className="fin-grid">
                {datos.eventos.map((e) => (
                  <article key={e.id_asignacion} className="fin-card">
                    <div className="fin-card-cab">
                      <div className="fin-card-titulo">
                        <strong>{e.tipo}</strong>
                        <span className="fin-sub">{formatearFecha(e.fecha)} · {e.cliente}</span>
                      </div>
                      <span className="fin-monto">{e.remuneracion === null ? '—' : clp(e.remuneracion)}</span>
                    </div>

                    <div className="fin-detalle">
                      <span>Rol: {e.rol}</span>
                      {e.pago && <span>Pagado el {formatearFecha(e.pago.fecha)} · {e.pago.medio_pago}</span>}
                    </div>

                    <div className="fin-card-pie">
                      <span className={`fin-estado fin-estado-${e.estado_pago === 'PAGADA' ? 'rendida' : 'pendiente'}`}>
                        {e.estado_pago === 'PAGADA' ? 'Pagada' : 'Por pagar'}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}