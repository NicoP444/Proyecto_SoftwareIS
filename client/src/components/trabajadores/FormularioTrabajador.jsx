import { useState } from 'react';
import { ESTADOS } from './ayudas.js';

const VACIO = { nombre: '', apellido: '', telefono_whatsapp: '', correo: '', observaciones: '', estado: 'activo' };

function validar(datos) {
  const errores = {};
  if (!datos.nombre.trim()) errores.nombre = 'Ingresa el nombre';
  if (!datos.apellido.trim()) errores.apellido = 'Ingresa el apellido';
  if (!datos.telefono_whatsapp.trim()) errores.telefono_whatsapp = 'Ingresa el teléfono de WhatsApp';
  if (datos.correo && !/^\S+@\S+\.\S+$/.test(datos.correo)) errores.correo = 'Correo no válido';
  return errores;
}

/**
 * Formulario de trabajador. Sirve para CREAR y para EDITAR.
 * onGuardar recibe los datos y debe devolver una promesa (la llamada al back).
 */
export default function FormularioTrabajador({ inicial = VACIO, textoBoton, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);

  function cambiar(e) {
    setDatos({ ...datos, [e.target.name]: e.target.value });
    setErrores({ ...errores, [e.target.name]: undefined });
    setMensaje(null);
  }

  async function enviar(e) {
    e.preventDefault();
    const encontrados = validar(datos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

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

      <div className="fila-doble">
        {campo('nombre', 'Nombre')}
        {campo('apellido', 'Apellido')}
      </div>

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
