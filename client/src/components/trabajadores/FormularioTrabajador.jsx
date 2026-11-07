import { useState } from 'react';
import { ESTADOS } from './ayudas.js';

// lo que vamos a recibir del usuario
const VACIO = { nombre: '', telefono_whatsapp: '', correo: '', observaciones: '', estado: 'activo' };

function validar(datos) { // validamos que todo este bien...
  const errores = {};
  if (!datos.nombre.trim()) errores.nombre = 'Ingresa el nombre';
  if (!datos.telefono_whatsapp.trim()) errores.telefono_whatsapp = 'Ingresa el teléfono de WhatsApp';
  if (datos.correo && !/^\S+@\S+\.\S+$/.test(datos.correo)) errores.correo = 'Correo no válido';
  return errores;
}

/**
 * Formulario de trabajador. Sirve para CREAR y para EDITAR.
 * 
 */
export default function FormularioTrabajador({ inicial = VACIO, textoBoton, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState(inicial);// objeto de datos, para almacenar los valores del formulario
  const [errores, setErrores] = useState({});// objeto de errores, para mostrar mensajes de error al usuario
  const [mensaje, setMensaje] = useState(null);// objeto de mensaje, para mostrar mensajes de éxito o error al usuario
  const [guardando, setGuardando] = useState(false);// booleano que indica si se está guardando el formulario, para deshabilitar el botón de guardar mientras se guarda



  function cambiar(e) {
    setDatos({ ...datos, [e.target.name]: e.target.value });
    setErrores({ ...errores, [e.target.name]: undefined });
    setMensaje(null);
  }

  async function enviar(e) {
    e.preventDefault(); // prevenimos el comportamiento por defecto del formulario, que es recargar la pagina
    const encontrados = validar(datos); // validamos los datos del formulario
    setErrores(encontrados);// si hay errores, los mostramos al usuario
    if (Object.keys(encontrados).length > 0) return; // encontramos si hay elemntos guardados y los trasforma en []

    setGuardando(true);
    try {
      await onGuardar(datos);
      setMensaje({ tipo: 'exito', texto: 'Datos guardados correctamente.' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setGuardando(false);
    }
  }

  // Pequeña función para no repetir el mismo bloque en cada campo
  function campo(nombre, etiqueta, props = {}) {
    return (
      <div className="campo">
        <label htmlFor={`trabajador-${nombre}`}>{etiqueta}</label>
        <input id={`trabajador-${nombre}`} name={nombre} value={datos[nombre]} onChange={cambiar} {...props} />
        {errores[nombre] && <span className="campo-error">{errores[nombre]}</span>}
      </div>
    );
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      {mensaje && <div className={`mensaje mensaje-${mensaje.tipo}`}>{mensaje.texto}</div>}

      {campo('nombre', 'Nombre')}

      <div className="campo">
        <label htmlFor="trabajador-estado">Estado</label>
        <select id="trabajador-estado" name="estado" value={datos.estado} onChange={cambiar}>
          {ESTADOS.map((estado) => (
            <option key={estado.valor} value={estado.valor}>
              {estado.texto}
            </option>
          ))}
        </select>
      </div>

      <div className="fila-doble">
        {campo('telefono_whatsapp', 'Teléfono WhatsApp', { type: 'tel', placeholder: '+56 9 1234 5678' })}
        {campo('correo', 'Correo electrónico', { type: 'email', placeholder: 'nombre@correo.com' })}
      </div>

      {campo('observaciones', 'Observaciones', { placeholder: 'Opcional' })}

      <div className="acciones">
        {onCancelar && (
          <button type="button" className="boton boton-secundario" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="submit" className="boton boton-principal" disabled={guardando}>
          {guardando ? 'Guardando…' : textoBoton}
        </button>
      </div>
    </form>
  );
}