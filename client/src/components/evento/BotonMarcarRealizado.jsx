import React, { useState } from 'react';
import { marcarEventoComoRealizado } from '../../services/marcarEvento.service.js';
import '../../styles/MarcarEvento.css';

export default function BotonMarcarRealizado({ evento, onEventoActualizado }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  if (!evento || evento.estado !== 'CONFIRMADO') return null;

  const fechaBase = new Date(evento.fecha);
  const horaInicio = evento.hora_inicio ? new Date(evento.hora_inicio) : null;
  const horaTermino = new Date(evento.hora_termino);

  const esMedianoche =
    horaTermino.getUTCHours() === 0 &&
    horaTermino.getUTCMinutes() === 0 &&
    horaTermino.getUTCSeconds() === 0;

  const inicioEvento = horaInicio
    ? new Date(
        fechaBase.getUTCFullYear(),
        fechaBase.getUTCMonth(),
        fechaBase.getUTCDate(),
        horaInicio.getUTCHours(),
        horaInicio.getUTCMinutes(),
        horaInicio.getUTCSeconds()
      )
    : null;

  const finEvento = new Date(
    fechaBase.getUTCFullYear(),
    fechaBase.getUTCMonth(),
    fechaBase.getUTCDate() + (esMedianoche ? 1 : 0),
    horaTermino.getUTCHours(),
    horaTermino.getUTCMinutes(),
    horaTermino.getUTCSeconds()
  );

  const ahora = new Date();
  const aunNoInicia = inicioEvento && ahora < inicioEvento;
  const yaTermino = ahora >= finEvento;
  const sinPersonal = !evento.asignaciones || evento.asignaciones.length === 0;

  const reservas = evento.reservas_kit || [];
  const kitsPendientes =
    reservas.length > 0 &&
    (!reservas.some((r) => r.salida && r.salida.fecha_hora_retorno) ||
      reservas.some((r) => r.salida && !r.salida.fecha_hora_retorno));

  const habilitado = yaTermino && !sinPersonal && !kitsPendientes;

  let textoBoton = 'Marcar como Realizado';
  let tituloTooltip = '';

  if (cargando) {
    textoBoton = 'Procesando...';
  } else if (aunNoInicia) {
    textoBoton = 'Programado';
    tituloTooltip = `Inicia a las ${inicioEvento.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } else if (!yaTermino) {
    textoBoton = 'En transmisión';
    tituloTooltip = `Disponible después de las ${finEvento.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } else if (sinPersonal) {
    textoBoton = 'Sin personal';
    tituloTooltip = 'Debes asignar al menos un trabajador al evento antes de cerrarlo';
  } else if (kitsPendientes) {
    textoBoton = 'Kits pendientes';
    tituloTooltip = 'Debe haber al menos un kit retornado y ninguno en terreno';
  }

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
        disabled={!habilitado || cargando}
        title={tituloTooltip}
        className={`mev-boton-estado ${habilitado ? 'listo' : ''}`}
      >
        {textoBoton}
      </button>
      {error && <span className="mev-boton-error">{error}</span>}
    </div>
  );
}