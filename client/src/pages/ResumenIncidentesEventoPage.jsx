import React, { useState, useEffect } from 'react';
import ResumenIncidentesEvento from '../components/incidentes/ResumenIncidentesEvento.jsx';
import { obtenerEventos } from '../services/incidente.service.js';

export default function ResumenIncidentesEventoPage() {
  const [eventos, setEventos] = useState([]);
  const [idEventoSeleccionado, setIdEventoSeleccionado] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerEventos()
      .then((res) => {
        const lista = res?.data || res || [];
        setEventos(Array.isArray(lista) ? lista : []);
      })
      .catch((err) => console.error('Error al cargar eventos:', err))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Margen para que no quede tapado por la barra lateral si existe */}
      <div style={{ flex: 1, padding: '2rem 3rem', marginLeft: '240px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
            Resumen de Incidentes por Evento
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Consulte los incidentes valorizados de un evento realizado o confirme si finalizó sin incidentes.
          </p>

          <div style={{ marginBottom: '1.5rem', maxWidth: '450px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#334151' }}>
              Seleccionar Evento Realizado:
            </label>
            {cargando ? (
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Cargando eventos...</p>
            ) : (
              <select
                value={idEventoSeleccionado}
                onChange={(e) => setIdEventoSeleccionado(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="">-- Seleccione un evento para ver su resumen --</option>
                {eventos.map((ev) => (
                  <option key={ev.id_evento} value={ev.id_evento}>
                    Evento #{ev.id_evento} - {ev.tipo} ({ev.fecha ? new Date(ev.fecha).toLocaleDateString() : 'Sin fecha'}) - {ev.estado}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Componente RF-P6-06 */}
          {idEventoSeleccionado ? (
            <ResumenIncidentesEvento idEvento={idEventoSeleccionado} />
          ) : (
            <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem' }}>
              Seleccione un evento arriba para desplegar el resumen correspondiente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}