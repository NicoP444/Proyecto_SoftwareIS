import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarEventosConfirmados } from '../services/marcarEvento.service.js';
import BotonMarcarRealizado from '../components/evento/BotonMarcarRealizado.jsx';
import '../styles/MarcarEvento.css';

export default function MarcarEventoRealizado() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const cargarEventos = async () => {
    try {
      setCargando(true);
      const res = await listarEventosConfirmados();
      setEventos(res.data || res || []);
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.message || 'Error al cargar eventos confirmados.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  const handleEventoActualizado = (idEvento) => {
    setMensaje({
      tipo: 'exito',
      texto: `Evento #${idEvento} marcado como Realizado exitosamente. Las rendiciones del personal quedaron en estado Pendiente.`,
    });
    cargarEventos();
  };

  return (
    <div>
      {/* Cabecera superior unificada */}
      <div className="encabezado">
        <div>
          <h1>Eventos Pendientes de Cierre</h1>
          <p>Marca como realizados los eventos cuya transmisión ya finalizó</p>
        </div>
        <div className="encabezado-botones">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="mev-btn-volver"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>

      {/* Tarjeta contenedora institucional */}
      <div className="mev-panel">
        {mensaje.texto && (
          <div
            className={`mev-mensaje ${
              mensaje.tipo === 'exito' ? 'mev-mensaje-exito' : 'mev-mensaje-error'
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        {cargando ? (
          <div className="mev-cargando">Cargando eventos confirmados...</div>
        ) : eventos.length === 0 ? (
          <div className="mev-vacio">
            No hay eventos en estado Confirmado pendientes de cierre en este momento.
          </div>
        ) : (
          <div className="mev-tabla-scroll">
            <table className="mev-tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>TIPO / CLIENTE</th>
                  <th>FECHA</th>
                  <th>HORA TÉRMINO</th>
                  <th>PERSONAL ASIGNADO</th>
                  <th className="mev-th-centro">ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((ev) => (
                  <tr key={ev.id_evento}>
                    <td className="mev-td-id">#{ev.id_evento}</td>
                    <td>
                      <div className="mev-evento-tipo">{ev.tipo}</div>
                      <div className="mev-evento-cliente">
                        {ev.cliente?.nombre || 'Sin cliente asignado'}
                      </div>
                    </td>
                    <td className="mev-td-fecha">
                      {new Date(ev.fecha).toLocaleDateString('es-CL', { timeZone: 'UTC' })}
                    </td>
                    <td className="mev-td-hora">
                      {new Date(ev.hora_termino).toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'UTC',
                      })}
                    </td>
                    <td className="mev-td-personal">
                      {ev.asignaciones?.length || 0} trabajador(es)
                    </td>
                    <td className="mev-td-centro">
                      <BotonMarcarRealizado
                        evento={ev}
                        onEventoActualizado={handleEventoActualizado}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}