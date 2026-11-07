import React, { useState } from 'react';
import { marcarEventoComoRealizado } from '../../services/marcarEvento.service.js';

export default function BotonMarcarRealizado({ evento, onEventoActualizado }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  if (!evento || evento.estado !== 'CONFIRMADO') return null;

  // Validar si ya pasó la hora de término
  const fechaBase = new Date(evento.fecha);
  const horaTermino = new Date(evento.hora_termino);
  const finEvento = new Date(
    fechaBase.getUTCFullYear(),
    fechaBase.getUTCMonth(),
    fechaBase.getUTCDate(),
    horaTermino.getUTCHours(),
    horaTermino.getUTCMinutes(),
    horaTermino.getUTCSeconds()
  );
  const yaTermino = new Date() >= finEvento;

  const handleMarcar = async () => {
    setError('');
    setCargando(true);
    try {
      await marcarEventoComoRealizado(evento.id_evento);
      if (onEventoActualizado) onEventoActualizado(evento.id_evento);
    } catch (err) {
      setError(err.message || 'Error al marcar como realizado');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.25rem' }}>
      <button
        type="button"
        onClick={handleMarcar}
        disabled={!yaTermino || cargando}
        title={!yaTermino ? `Disponible después de las ${finEvento.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
        style={{
          padding: '0.45rem 0.9rem',
          backgroundColor: yaTermino ? '#16a34a' : '#9ca3af',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          cursor: !yaTermino || cargando ? 'not-allowed' : 'pointer',
          fontWeight: '600',
          fontSize: '0.85rem',
          transition: 'background-color 0.2s',
        }}
      >
        {cargando ? 'Procesando...' : yaTermino ? 'Marcar como Realizado' : 'En transmisión'}
      </button>
      {error && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{error}</span>}
    </div>
  );
}