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
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem' }}>
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Cabecera con título y botón de regreso */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '1rem',
            gap: '1rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              Marcar Evento como Realizado (RF-P7-01)
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', marginTop: '0.4rem', marginBottom: 0 }}>
              Permite cambiar eventos de <strong>Confirmado</strong> a <strong>Realizado</strong> solo después de su hora de término.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/home')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '36px',
              padding: '0 16px',
              backgroundColor: '#333c87',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              fontSize: '14px',
              fontWeight: '600',
              lineHeight: '1',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              whiteSpace: 'nowrap',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#272e6b')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#333c87')}
          >
            ← Volver al Inicio
          </button>
        </div>

        {mensaje.texto && (
          <div
            style={{
              padding: '0.9rem 1.2rem',
              marginBottom: '1.5rem',
              borderRadius: '6px',
              backgroundColor: mensaje.tipo === 'exito' ? '#dcfce7' : '#fee2e2',
              color: mensaje.tipo === 'exito' ? '#166534' : '#991b1b',
              fontWeight: '500',
              border: `1px solid ${mensaje.tipo === 'exito' ? '#86efac' : '#fca5a5'}`,
            }}
          >
            {mensaje.texto}
          </div>
        )}

        {cargando ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280', fontSize: '1rem' }}>
            Cargando eventos confirmados...
          </div>
        ) : eventos.length === 0 ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px dashed #d1d5db',
              color: '#6b7280',
            }}
          >
            No hay eventos en estado Confirmado pendientes de cierre.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '0.85rem 1rem', color: '#374151', fontWeight: '600' }}>ID</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#374151', fontWeight: '600' }}>Tipo / Cliente</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#374151', fontWeight: '600' }}>Fecha</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#374151', fontWeight: '600' }}>Hora Término</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#374151', fontWeight: '600' }}>Personal Asignado</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#374151', fontWeight: '600' }}>
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((ev) => (
                  <tr key={ev.id_evento} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 'bold', color: '#111827' }}>
                      #{ev.id_evento}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>{ev.tipo}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{ev.cliente?.nombre || 'Sin cliente'}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#4b5563' }}>
                      {new Date(ev.fecha).toLocaleDateString('es-CL', { timeZone: 'UTC' })}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#4b5563' }}>
                      {new Date(ev.hora_termino).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#4b5563' }}>
                      {ev.asignaciones?.length || 0} trabajador(es)
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => handleMarcarRealizado(ev.id_evento)}
                        disabled={procesandoId === ev.id_evento}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: procesandoId === ev.id_evento ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          transition: 'background-color 0.2s',
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