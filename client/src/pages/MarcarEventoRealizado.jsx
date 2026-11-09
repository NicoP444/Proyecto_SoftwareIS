import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listarEventosConfirmados,
  marcarEventoComoRealizado,
} from '../services/marcarEvento.service.js';

export default function MarcarEventoRealizado() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [procesandoId, setProcesandoId] = useState(null);

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

  const handleMarcarRealizado = async (idEvento) => {
    setMensaje({ tipo: '', texto: '' });
    setProcesandoId(idEvento);
    try {
      await marcarEventoComoRealizado(idEvento);
      setMensaje({
        tipo: 'exito',
        texto: `Evento #${idEvento} marcado como Realizado exitosamente. Las rendiciones del personal quedaron en estado Pendiente.`,
      });
      cargarEventos();
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.message || 'No se pudo marcar el evento como realizado.',
      });
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Cabecera superior unificada */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Eventos Pendientes de Cierre
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/home')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1.1rem',
            backgroundColor: '#333c87',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.88rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#272e6b')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#333c87')}
        >
          ← Volver al inicio
        </button>
      </div>

      {/* Tarjeta contenedora institucional */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #eef2f6',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          padding: '1.5rem',
        }}
      >
        {mensaje.texto && (
          <div
            style={{
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: '500',
              backgroundColor: mensaje.tipo === 'exito' ? '#dcfce7' : '#fee2e2',
              color: mensaje.tipo === 'exito' ? '#15803d' : '#991b1b',
              border: mensaje.tipo === 'exito' ? '1px solid #bbf7d0' : '1px solid #fecaca',
            }}
          >
            {mensaje.texto}
          </div>
        )}

        {cargando ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.92rem' }}>
            Cargando eventos confirmados...
          </div>
        ) : eventos.length === 0 ? (
          <div
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              color: '#94a3b8',
              fontSize: '0.9rem',
            }}
          >
            No hay eventos en estado Confirmado pendientes de cierre en este momento.
          </div>
        ) : (
          <div
            style={{
              overflowX: 'auto',
              maxHeight: '460px',
              overflowY: 'auto',
              border: '1px solid #f1f5f9',
              borderRadius: '10px',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                    color: '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    letterSpacing: '0.05em',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#ffffff',
                    zIndex: 1,
                  }}
                >
                  <th style={{ padding: '0.75rem 0.75rem' }}>ID</th>
                  <th style={{ padding: '0.75rem 0.75rem' }}>TIPO / CLIENTE</th>
                  <th style={{ padding: '0.75rem 0.75rem' }}>FECHA</th>
                  <th style={{ padding: '0.75rem 0.75rem' }}>HORA TÉRMINO</th>
                  <th style={{ padding: '0.75rem 0.75rem' }}>PERSONAL ASIGNADO</th>
                  <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((ev) => (
                  <tr key={ev.id_evento} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '0.85rem 0.75rem', fontWeight: '700', color: '#0f172a' }}>
                      #{ev.id_evento}
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{ev.tipo}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        {ev.cliente?.nombre || 'Sin cliente asignado'}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(ev.fecha).toLocaleDateString('es-CL', { timeZone: 'UTC' })}
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', color: '#475569', whiteSpace: 'nowrap' }}>
                      {new Date(ev.hora_termino).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', color: '#334155' }}>
                      {ev.asignaciones?.length || 0} trabajador(es)
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleMarcarRealizado(ev.id_evento)}
                        disabled={procesandoId === ev.id_evento}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '0.45rem 0.9rem',
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: procesandoId === ev.id_evento ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '0.82rem',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                          transition: 'background-color 0.15s ease',
                          opacity: procesandoId === ev.id_evento ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (procesandoId !== ev.id_evento) e.currentTarget.style.backgroundColor = '#15803d';
                        }}
                        onMouseLeave={(e) => {
                          if (procesandoId !== ev.id_evento) e.currentTarget.style.backgroundColor = '#16a34a';
                        }}
                      >
                        {procesandoId === ev.id_evento ? 'Validando...' : 'Marcar Realizado'}
                      </button>
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