import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarEventosConfirmados } from '../../services/marcarEvento.service.js';
import BotonMarcarRealizado from './BotonMarcarRealizado.jsx';
import '../../styles/MarcarEvento.css';

export default function EventosPendientesCierre() {
  const navigate = useNavigate();
  const [eventosConfirmados, setEventosConfirmados] = useState([]);
  const [cargandoConfirmados, setCargandoConfirmados] = useState(true);

  const cargarEventosConfirmados = () => {
    setCargandoConfirmados(true);
    listarEventosConfirmados()
      .then((res) => {
        const lista = res?.data || res || [];
        // Se cortan a 3 elementos únicamente para la tarjeta compacta del Home
        setEventosConfirmados(lista.slice(0, 3));
      })
      .catch((err) => console.error('Error al cargar eventos:', err))
      .finally(() => setCargandoConfirmados(false));
  };

  useEffect(() => {
    cargarEventosConfirmados();
  }, []);

  return (
    <section className="panel mev-home-panel">
      <div className="panel-head">
        <h3>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
          Eventos Pendientes de Cierre
        </h3>
        <button
          className="panel-link"
          onClick={() => navigate('/marcar-evento')}
        >
          Ver todos →
        </button>
      </div>

      {cargandoConfirmados ? (
        <div className="mev-home-cargando">Cargando eventos...</div>
      ) : eventosConfirmados.length === 0 ? (
        <div className="empty">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          No hay eventos confirmados pendientes de cierre
        </div>
      ) : (
        <div className="mev-home-lista">
          {eventosConfirmados.map((ev) => (
            <div key={ev.id_evento} className="mev-home-card">
              <div>
                <div className="mev-home-card-cab">
                  <strong className="mev-home-card-titulo">
                    #{ev.id_evento} {ev.tipo}
                  </strong>
                  <span className="mev-home-card-fecha">
                    {new Date(ev.fecha).toLocaleDateString('es-CL', { timeZone: 'UTC' })}
                  </span>
                </div>
                <p className="mev-home-card-detalle">
                  Cliente: {ev.cliente?.nombre || 'General'} | Término:{' '}
                  {new Date(ev.hora_termino).toLocaleTimeString('es-CL', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'UTC',
                  })}
                </p>
              </div>

              <BotonMarcarRealizado
                evento={ev}
                onEventoActualizado={cargarEventosConfirmados}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}