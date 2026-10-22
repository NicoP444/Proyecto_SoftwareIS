import { useState } from 'react';
import { CalendarRange, Clock, Plus } from 'lucide-react';
import { crearBloqueDisponibilidad } from '../../services/personalServicio.js';
import { ordenarBloques, periodoMesActual, textoFechasBloque, textoHorarioBloque } from './ayudas.js';

/** Datos vacíos del formulario: propone el mes actual y horario de oficina */
function bloqueNuevo() {
  const mes = periodoMesActual();
  return { fecha_inicio: mes.inicio, fecha_termino: mes.termino, hora_inicio: '09:00', hora_termino: '18:00' };
}

function validar(bloque) {
  if (!bloque.fecha_inicio || !bloque.fecha_termino) return 'Indica la fecha de inicio y de término';
  if (bloque.fecha_inicio > bloque.fecha_termino) return 'La fecha de término debe ser posterior a la de inicio';
  if (!bloque.hora_inicio || !bloque.hora_termino) return 'Indica la hora de inicio y de término';
  if (bloque.hora_inicio >= bloque.hora_termino) return 'La hora de término debe ser mayor a la de inicio';
  return null;
}

/**
 * Disponibilidad del trabajador: lista de bloques (desde - hasta, con horario)
 * y un formulario para agregar un bloque nuevo.
 */
export default function EditorDisponibilidad({ idTrabajador, disponibilidad, onGuardado }) {
  const [bloque, setBloque] = useState(bloqueNuevo);
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);

  function cambiar(e) {
    setBloque({ ...bloque, [e.target.name]: e.target.value });
    setMensaje(null);
  }

  async function agregar(e) {
    e.preventDefault();
    const error = validar(bloque);
    if (error) return setMensaje({ tipo: 'error', texto: error });

    setGuardando(true);
    try {
      await crearBloqueDisponibilidad(idTrabajador, bloque);
      setMensaje({ tipo: 'exito', texto: 'Bloque agregado.' });
      setBloque(bloqueNuevo());
      onGuardado();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="formulario">
      {/* Bloques ya registrados */}
      <h4 className="subtitulo">Bloques registrados</h4>
      {disponibilidad.length === 0 ? (
        <p className="texto-tenue">Aún no tiene disponibilidad registrada.</p>
      ) : (
        <ul className="lista-bloques">
          {ordenarBloques(disponibilidad).map((b) => (
            <li key={b.nro_bloque ?? `${b.fecha_inicio}-${b.hora_inicio}`}>
              <span className="bloque-fechas">
                <CalendarRange size={15} /> {textoFechasBloque(b)}
              </span>
              <span className="bloque-horario">
                <Clock size={15} /> {textoHorarioBloque(b)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Formulario para agregar un bloque */}
      <form className="nuevo-bloque" onSubmit={agregar} noValidate>
        <h4 className="subtitulo">Agregar bloque</h4>
        {mensaje && <div className={`mensaje mensaje-${mensaje.tipo}`}>{mensaje.texto}</div>}

        <div className="fila-doble">
          <div className="campo">
            <label htmlFor="bloque-fecha-inicio">Disponible desde</label>
            <input id="bloque-fecha-inicio" type="date" name="fecha_inicio" value={bloque.fecha_inicio} onChange={cambiar} />
          </div>
          <div className="campo">
            <label htmlFor="bloque-fecha-termino">Disponible hasta</label>
            <input
              id="bloque-fecha-termino"
              type="date"
              name="fecha_termino"
              min={bloque.fecha_inicio}
              value={bloque.fecha_termino}
              onChange={cambiar}
            />
          </div>
        </div>

        <div className="fila-doble">
          <div className="campo">
            <label htmlFor="bloque-hora-inicio">Hora de inicio</label>
            <input id="bloque-hora-inicio" type="time" name="hora_inicio" value={bloque.hora_inicio} onChange={cambiar} />
          </div>
          <div className="campo">
            <label htmlFor="bloque-hora-termino">Hora de término</label>
            <input id="bloque-hora-termino" type="time" name="hora_termino" value={bloque.hora_termino} onChange={cambiar} />
          </div>
        </div>

        <div className="acciones">
          <button type="submit" className="boton boton-principal" disabled={guardando}>
            <Plus size={16} /> {guardando ? 'Guardando…' : 'Agregar bloque'}
          </button>
        </div>
      </form>
    </div>
  );
}