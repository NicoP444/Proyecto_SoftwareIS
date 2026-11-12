import { useState } from 'react';
import { CalendarRange, Clock, Plus, Pencil } from 'lucide-react';
import { 
  crearBloqueDisponibilidad, 
  actualizarBloqueDisponibilidad 
} from '../../services/personalServicio.js';
import { periodoMesActual, textoFechasBloque, textoHorarioBloque } from './ayudas.js';


//bloque disponibilidad

function bloqueNuevo(){ 
  const mes = periodoMesActual();
  return { fecha_inicio: mes.inicio, fecha_termino: mes.termino, hora_inicio: '09:00', hora_termino: '18:00' }; // valores por defecto
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

  // declaramos esta funciona cada vez que el usuario cambia un valor o actualiza
  function cambiar(e) {
    setBloque({ ...bloque, [e.target.name]: e.target.value }); 
    setMensaje(null);
  }

  //declaramos la funcion asincornica, permite esperar la respuesta del servidor, recibe un evento e, cuando el usuario hace click en guardar
  async function guardar(e) {
    e.preventDefault(); // prevenimos el comportamiento por defecto del formulario, que es recargar la pagina
    const error = validar(bloque); // verificamos que el bloque sea valido.
    if (error) return setMensaje({ tipo: 'error', texto: error });// si es error, mostramos el mensaje

    setGuardando(true); // animacion 
    try {
      if (bloque.nro_bloque) {// llamamos a las demas funciones de service 
        await actualizarBloqueDisponibilidad(idTrabajador, bloque.nro_bloque, bloque);
        setMensaje({ tipo: 'exito', texto: 'Bloque actualizado correctamente.' });
      } else {
        await crearBloqueDisponibilidad(idTrabajador, bloque);
        setMensaje({ tipo: 'exito', texto: 'Bloque agregado correctamente.' });
      }
      // limpiamos todo y devolvemos el por defecto 
      setBloque(bloqueNuevo());
      onGuardado();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  // funcion para editar un bloque, recibe un objeto b, que representa el bloque a editar, actualiza el estado bloque con los valores del bloque seleccionado y limpia el mensaje de error o éxito
  function editarBloque(b) {
    setBloque({ ...b });
    setMensaje(null);
  }
  // funcion para cancelar la edicion, restablece el estado bloque a un nuevo bloque con valores por defecto y limpia el mensaje de error o éxito
  function cancelarEdicion() {
    setBloque(bloqueNuevo());
    setMensaje(null);
  }

  return (
    // todo el fomulario
    <div className="formulario"> 
      <h4 className="subtitulo">Bloques registrados</h4>
      
      {disponibilidad.length === 0 ? ( // si no hay disponibilidad, mostramos un mensaje
        <p className="texto-tenue">Aún no tiene disponibilidad registrada.</p>
      ) : ( // creamos el fomrulario con la lista de bloques de disponibilidad, cada bloque tiene un boton para editarlo
        <ul className="lista-bloques"> 
          {disponibilidad.map((b) => (
            <li 
              key={b.nro_bloque ? b.nro_bloque : b.fecha_inicio + '-' + b.hora_inicio}
              //definimos el kwy, para que react sepa cual es quien 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }} //gap separacion
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