import { useEffect, useState } from 'react';
import { guardarDisponibilidad } from '../../services/personalServicio.js';
import { DIAS, aFecha, aHora, periodoMesActual } from './ayudas.js';

/** Pasa la lista del back a un objeto fácil de editar: { 1: {activo, inicio, termino}, 2: ... } */
function armarSemana(disponibilidad) {
  const semana = {};
  DIAS.forEach((dia) => {
    const registro = disponibilidad.find((d) => d.dia_semana === dia.numero);
    semana[dia.numero] = registro
      ? { activo: true, inicio: aHora(registro.hora_inicio), termino: aHora(registro.hora_termino) }
      : { activo: false, inicio: '09:00', termino: '18:00' };
  });
  return semana;
}

/** Toma el período guardado o propone el mes actual. */
function armarPeriodo(disponibilidad) {
  const conFecha = disponibilidad.find((d) => d.fecha_inicio);
  return conFecha
    ? { inicio: aFecha(conFecha.fecha_inicio), termino: aFecha(conFecha.fecha_termino) }
    : periodoMesActual();
}

/**
 * Editor de disponibilidad: período (desde / hasta) + días y horarios.
 */
export default function EditorDisponibilidad({ idTrabajador, disponibilidad, onGuardado }) {
  const [semana, setSemana] = useState(armarSemana(disponibilidad));
  const [periodo, setPeriodo] = useState(armarPeriodo(disponibilidad));
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Cuando llegan datos nuevos del back, se cargan en el editor
  useEffect(() => {
    setSemana(armarSemana(disponibilidad));
    setPeriodo(armarPeriodo(disponibilidad));
  }, [disponibilidad]);

  function cambiarDia(numero, cambios) {
    setSemana({ ...semana, [numero]: { ...semana[numero], ...cambios } });
    setMensaje(null);
  }

  function validar() {
    if (!periodo.inicio || !periodo.termino) return 'Indica la fecha de inicio y de término';
    if (periodo.inicio > periodo.termino) return 'La fecha de término debe ser posterior a la de inicio';
    const diaMalo = DIAS.find((dia) => semana[dia.numero].activo && semana[dia.numero].inicio >= semana[dia.numero].termino);
    if (diaMalo) return `${diaMalo.nombre}: la hora de término debe ser mayor a la de inicio`;
    return null;
  }

  async function guardar() {
    const error = validar();
    if (error) return setMensaje({ tipo: 'error', texto: error });

    // Un registro por cada día marcado, con el mismo período
    const nuevos = DIAS.filter((dia) => semana[dia.numero].activo).map((dia) => ({
      dia_semana: dia.numero,
      hora_inicio: semana[dia.numero].inicio,
      hora_termino: semana[dia.numero].termino,
      fecha_inicio: periodo.inicio,
      fecha_termino: periodo.termino,
    }));

    setGuardando(true);
    try {
      await guardarDisponibilidad(idTrabajador, disponibilidad, nuevos);
      setMensaje({ tipo: 'exito', texto: 'Disponibilidad guardada.' });
      onGuardado();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="formulario">
      {mensaje && <div className={`mensaje mensaje-${mensaje.tipo}`}>{mensaje.texto}</div>}

      <div className="fila-doble">
        <div className="campo">
          <label htmlFor="fecha-inicio">Disponible desde</label>
          <input id="fecha-inicio" type="date" value={periodo.inicio} onChange={(e) => setPeriodo({ ...periodo, inicio: e.target.value })} />
        </div>
        <div className="campo">
          <label htmlFor="fecha-termino">Disponible hasta</label>
          <input
            id="fecha-termino"
            type="date"
            min={periodo.inicio}
            value={periodo.termino}
            onChange={(e) => setPeriodo({ ...periodo, termino: e.target.value })}
          />
        </div>
      </div>

      <ul className="lista-dias">
        {DIAS.map((dia) => {
          const datos = semana[dia.numero];
          return (
            <li key={dia.numero} className={datos.activo ? '' : 'apagado'}>
              <label className="interruptor">
                <input type="checkbox" checked={datos.activo} onChange={(e) => cambiarDia(dia.numero, { activo: e.target.checked })} />
                <span className="interruptor-pista" />
                {dia.nombre}
              </label>
              <div className="horario">
                <input
                  type="time"
                  className="input"
                  value={datos.inicio}
                  disabled={!datos.activo}
                  onChange={(e) => cambiarDia(dia.numero, { inicio: e.target.value })}
                  aria-label={`Hora de inicio del ${dia.nombre}`}
                />
                <span>a</span>
                <input
                  type="time"
                  className="input"
                  value={datos.termino}
                  disabled={!datos.activo}
                  onChange={(e) => cambiarDia(dia.numero, { termino: e.target.value })}
                  aria-label={`Hora de término del ${dia.nombre}`}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="acciones">
        <button
          type="button"
          className="boton boton-secundario"
          disabled={guardando}
          onClick={() => {
            setSemana(armarSemana(disponibilidad));
            setPeriodo(armarPeriodo(disponibilidad));
            setMensaje(null);
          }}
        >
          Descartar
        </button>
        <button type="button" className="boton boton-principal" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar disponibilidad'}
        </button>
      </div>
    </div>
  );
}
