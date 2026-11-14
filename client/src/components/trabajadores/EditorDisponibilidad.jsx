import { useState } from 'react';
import { CalendarRange, Plus, Pencil, Trash2 } from 'lucide-react';
import { 
  crearBloqueDisponibilidad, 
  actualizarBloqueDisponibilidad,
  eliminarBloqueDisponibilidad
} from '../../services/personalServicio.js';
import { periodoMesActual, textoFechasBloque } from './ayudas.js';

// Valores por defecto: solo fechas
function bloqueNuevo() { 
  const mes = periodoMesActual();
  return { fecha_inicio: mes.inicio, fecha_termino: mes.termino }; 
}

// Validación simplificada sin horas
function validar(bloque) {
  if (!bloque.fecha_inicio || !bloque.fecha_termino) return 'Indica la fecha de inicio y de término';
  if (bloque.fecha_inicio > bloque.fecha_termino) return 'La fecha de término debe ser posterior a la de inicio';
  return null;
}

export default function EditorDisponibilidad({ idTrabajador, disponibilidad, onGuardado }) {
  const [bloque, setBloque] = useState(bloqueNuevo);
  const [mensaje, setMensaje] = useState(null); 
  const [guardando, setGuardando] = useState(false);
  const [bloqueAEliminar, setBloqueAEliminar] = useState(null); 

  // Declaramos esta función cada vez que el usuario cambia un valor
  function cambiar(e) {
    setBloque({ ...bloque, [e.target.name]: e.target.value }); 
    setMensaje(null);
  }

  // Guardar (Crear o Actualizar)
  async function guardar(e) {
    e.preventDefault(); 
    const error = validar(bloque); 
    if (error) return setMensaje({ tipo: 'error', texto: error });

    setGuardando(true); 
    try {
      if (bloque.nro_bloque) {
        await actualizarBloqueDisponibilidad(idTrabajador, bloque.nro_bloque, bloque);
        setMensaje({ tipo: 'exito', texto: 'Fechas actualizadas correctamente.' });
      } else {
        await crearBloqueDisponibilidad(idTrabajador, bloque);
        setMensaje({ tipo: 'exito', texto: 'Fechas agregadas correctamente.' });
      }
      setBloque(bloqueNuevo());
      onGuardado();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  // Prepara el formulario para editar
  function editarBloque(b) {
    setBloque({ ...b });
    setMensaje(null);
    setBloqueAEliminar(null); // Cancelamos si había un intento de eliminación pendiente
  }

  // Cancela la edición y limpia el form
  function cancelarEdicion() {
    setBloque(bloqueNuevo());
    setMensaje(null);
  }

  // Inicia el proceso de eliminación mostrando la alerta en la UI
  function eliminar(b) {
    setBloqueAEliminar(b);
    setMensaje({ 
      tipo: 'alerta', 
      texto: `¿Confirmas que deseas eliminar la disponibilidad desde el ${textoFechasBloque(b)}?` 
    });
    // Si estábamos editando justo este bloque, limpiamos el formulario para evitar conflictos
    if (bloque.nro_bloque === b.nro_bloque) {
      setBloque(bloqueNuevo());
    }
  }

  // Confirma y ejecuta la eliminación en el backend
  async function confirmarEliminacion() {
    if (!bloqueAEliminar) return;
    
    setGuardando(true);
    try {
      await eliminarBloqueDisponibilidad(idTrabajador, bloqueAEliminar.nro_bloque);
      setMensaje({ tipo: 'exito', texto: 'Disponibilidad eliminada correctamente.' });
      setBloqueAEliminar(null);
      onGuardado();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
      setBloqueAEliminar(null);
    } finally {
      setGuardando(false);
    }
  }

  // Cancela el intento de eliminación
  function cancelarEliminacion() {
    setBloqueAEliminar(null);
    setMensaje(null);
  }

  return (
    <div className="formulario"> 
      <h4 className="subtitulo">Disponibilidad registrada</h4>
      
      {disponibilidad.length === 0 ? ( 
        <p className="texto-tenue">Aún no tiene fechas registradas.</p>
      ) : ( 
        <ul className="lista-bloques"> 
          {disponibilidad.map((b) => (
            <li 
              key={b.nro_bloque ? b.nro_bloque : b.fecha_inicio}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <span className="bloque-fechas">
                  <CalendarRange size={15} /> {textoFechasBloque(b)}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  className="chip-quitar" 
                  onClick={() => editarBloque(b)} 
                  title="Editar fechas"
                  disabled={guardando || bloqueAEliminar !== null}
                >
                  <Pencil size={15} style={{ color: 'var(--primario)' }} />
                </button>
                <button 
                  type="button" 
                  className="chip-quitar" 
                  onClick={() => eliminar(b)} 
                  title="Eliminar fechas"
                  disabled={guardando || bloqueAEliminar !== null}
                >
                  <Trash2 size={15} style={{ color: 'var(--alerta)' }} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="nuevo-bloque" onSubmit={guardar} noValidate>
        <h4 className="subtitulo">{bloque.nro_bloque ? 'Editar fechas' : 'Agregar fechas'}</h4>
        
        {/* Renderizado condicional del mensaje y botones de confirmación */}
        {mensaje && (
          <div className={`mensaje mensaje-${mensaje.tipo}`}>
            <p style={{ margin: 0 }}>{mensaje.texto}</p>
            {bloqueAEliminar && (
              <div className="acciones" style={{ marginTop: '12px', justifyContent: 'flex-start' }}>
                <button 
                  type="button" 
                  className="boton" 
                  onClick={confirmarEliminacion} 
                  disabled={guardando}
                  style={{ 
                    backgroundColor: 'var(--alerta, #dc2626)', 
                    color: '#ffffff', 
                    borderColor: 'var(--alerta, #dc2626)',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {guardando ? 'Eliminando...' : 'Eliminar'}
                </button>
                <button 
                  type="button" 
                  className="boton" 
                  onClick={cancelarEliminacion} 
                  disabled={guardando}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}

        <div className="fila-doble">
          <div className="campo">
            <label htmlFor="bloque-fecha-inicio">Disponible desde</label>
            <input 
              id="bloque-fecha-inicio" 
              type="date" 
              name="fecha_inicio" 
              value={bloque.fecha_inicio} 
              onChange={cambiar} 
              disabled={bloqueAEliminar !== null || guardando} 
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
              disabled={bloqueAEliminar !== null || guardando}
            />
          </div>
        </div>

        <div className="acciones">
          {bloque.nro_bloque && (
            <button 
              type="button" 
              className="boton" 
              onClick={cancelarEdicion} 
              disabled={guardando || bloqueAEliminar !== null}
            >
              Cancelar
            </button>
          )}
          <button 
            type="submit" 
            className="boton boton-principal" 
            disabled={guardando || bloqueAEliminar !== null}
          >
            {bloque.nro_bloque ? <Pencil size={16} /> : <Plus size={16} />} 
            {guardando ? 'Guardando…' : (bloque.nro_bloque ? 'Actualizar' : 'Agregar')}
          </button>
        </div>
      </form>
    </div>
  );
}