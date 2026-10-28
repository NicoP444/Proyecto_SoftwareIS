import { useState } from 'react';
import { CalendarRange, Clock, Plus, Pencil } from 'lucide-react';
import { 
  crearBloqueDisponibilidad, 
  actualizarBloqueDisponibilidad 
} from '../../services/personalServicio.js';
import { periodoMesActual, textoFechasBloque, textoHorarioBloque } from './ayudas.js';

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

export default function EditorDisponibilidad({ idTrabajador, disponibilidad, onGuardado }) {
  const [bloque, setBloque] = useState(bloqueNuevo);
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);

  function cambiar(e) {
    setBloque({ ...bloque, [e.target.name]: e.target.value });
    setMensaje(null);
  }

  async function guardar(e) {
    e.preventDefault();
    const error = validar(bloque);
    if (error) return setMensaje({ tipo: 'error', texto: error });

    setGuardando(true);
    try {
      if (bloque.nro_bloque) {
        await actualizarBloqueDisponibilidad(idTrabajador, bloque.nro_bloque, bloque);
        setMensaje({ tipo: 'exito', texto: 'Bloque actualizado correctamente.' });
      } else {
        await crearBloqueDisponibilidad(idTrabajador, bloque);
        setMensaje({ tipo: 'exito', texto: 'Bloque agregado correctamente.' });
      }
      setBloque(bloqueNuevo());
      onGuardado();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  function editarBloque(b) {
    setBloque({ ...b });
    setMensaje(null);
  }

  function cancelarEdicion() {
    setBloque(bloqueNuevo());
    setMensaje(null);
  }

  return (
    <div className="formulario">
      <h4 className="subtitulo">Bloques registrados</h4>
      
      {disponibilidad.length === 0 ? (
        <p className="texto-tenue">Aún no tiene disponibilidad registrada.</p>
      ) : (
        <ul className="lista-bloques">
          {disponibilidad.map((b) => (
            <li 
              key={b.nro_bloque ? b.nro_bloque : b.fecha_inicio + '-' + b.hora_inicio} 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <span className="bloque-fechas">
                  <CalendarRange size={15} /> {textoFechasBloque(b)}
                </span>
                <span className="bloque-horario">
                  <Clock size={15} /> {textoHorarioBloque(b)}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  className="chip-quitar" 
                  onClick={() => editarBloque(b)} 
                  title="Editar bloque"
                >
                  <Pencil size={15} style={{ color: 'var(--primario)' }} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="nuevo-bloque" onSubmit={guardar} noValidate>
        <h4 className="subtitulo">{bloque.nro_bloque ? 'Editar bloque' : 'Agregar bloque'}</h4>
        {mensaje && <div className={`mensaje mensaje-${mensaje.tipo}`}>{mensaje.texto}</div>}

        <div className="fila-doble">
          <div className="campo">
            <label htmlFor="bloque-fecha-inicio">Disponible desde</label>
            <input 
              id="bloque-fecha-inicio" 
              type="date" 
              name="fecha_inicio" 
              value={bloque.fecha_inicio} 
              onChange={cambiar} 
            />
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
            <input 
              id="bloque-hora-inicio" 
              type="time" 
              name="hora_inicio" 
              value={bloque.hora_inicio} 
              onChange={cambiar} 
            />
          </div>
          <div className="campo">
            <label htmlFor="bloque-hora-termino">Hora de término</label>
            <input 
              id="bloque-hora-termino" 
              type="time" 
              name="hora_termino" 
              value={bloque.hora_termino} 
              onChange={cambiar} 
            />
          </div>
        </div>

        <div className="acciones">
          {bloque.nro_bloque && (
            <button type="button" className="boton" onClick={cancelarEdicion} disabled={guardando}>
              Cancelar
            </button>
          )}
          <button type="submit" className="boton boton-principal" disabled={guardando}>
            {bloque.nro_bloque ? <Pencil size={16} /> : <Plus size={16} />} 
            {guardando ? 'Guardando…' : (bloque.nro_bloque ? 'Actualizar bloque' : 'Agregar bloque')}
          </button>
        </div>
      </form>
    </div>
  );
}