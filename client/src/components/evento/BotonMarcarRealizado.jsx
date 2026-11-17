import React, { useState } from 'react';
import { marcarEventoComoRealizado } from '../../services/marcarEvento.service.js';
import '../../styles/MarcarEvento.css';

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
    <div className="mev-boton-wrap">
      <button
        type="button"
        onClick={handleMarcar}
        disabled={!yaTermino || cargando}
        title={
          !yaTermino
            ? `Disponible después de las ${finEvento.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : ''
        }
        className={`mev-boton-estado ${yaTermino ? 'listo' : ''}`}
      >
        {cargando ? 'Procesando...' : yaTermino ? 'Marcar como Realizado' : 'En transmisión'}
      </button>
      {error && <span className="mev-boton-error">{error}</span>}
    </div>
  );
}