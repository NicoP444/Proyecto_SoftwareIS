import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarTrabajadores, crearTrabajador, actualizarTrabajador } from '../services/trabajador.service.js';
import { obtenerUsuario } from '../services/http.js';
import './Trabajadores.css';

const formularioVacio = { nombre: '', telefono_whatsapp: '', observaciones: '' };

export default function Trabajadores() {
  const navigate = useNavigate();
  const usuario = obtenerUsuario(); // el dueño que inició sesión
  const [trabajadores, setTrabajadores] = useState([]);
  const [form, setForm] = useState(formularioVacio);
  const [editandoId, setEditandoId] = useState(null); // null = creando uno nuevo
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  async function cargarTrabajadores() {
    try {
      const datos = await listarTrabajadores(usuario.id);
      setTrabajadores(datos);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    cargarTrabajadores();
  }, []);

  function cambiarCampo(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function empezarEdicion(trabajador) {
    setEditandoId(trabajador.id_trabajador);
    setForm({
      nombre: trabajador.nombre,
      telefono_whatsapp: trabajador.telefono_whatsapp || '',
      observaciones: trabajador.observaciones || '',
    });
    setError('');
    setMensaje('');
  }

  function limpiarFormulario() {
    setEditandoId(null);
    setForm(formularioVacio);
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setMensaje('');

    try {
      if (editandoId) {
        await actualizarTrabajador(editandoId, form);
        setMensaje('Trabajador actualizado');
      } else {
        await crearTrabajador({ ...form, id_dueno: usuario.id });
        setMensaje('Trabajador creado');
      }
      limpiarFormulario();
      cargarTrabajadores();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="trabajadores">
      <button className="boton boton-gris" onClick={() => navigate('/home')}> 
        ← Volver al Home
      </button>

      <h1>Trabajadores</h1>

      <form className="caja" onSubmit={guardar}>
        <h2>{editandoId ? 'Editar trabajador' : 'Nuevo trabajador'}</h2>

        <label>Nombre</label>
        <input name="nombre" value={form.nombre} onChange={cambiarCampo} />

        <label>Teléfono WhatsApp (obligatorio)</label>
        <input
          name="telefono_whatsapp"
          value={form.telefono_whatsapp}
          onChange={cambiarCampo}
          placeholder="+56 9 1234 5678"
        />

        <label>Observaciones (opcional)</label>
        <textarea name="observaciones" value={form.observaciones} onChange={cambiarCampo} />

        {error && <p className="error">{error}</p>}
        {mensaje && <p className="exito">{mensaje}</p>}

        <div className="botones">
          <button type="submit" className="boton">
            {editandoId ? 'Guardar cambios' : 'Crear trabajador'}
          </button>
          {editandoId && (
            <button type="button" className="boton boton-gris" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <h2>Lista de trabajadores</h2>

      {trabajadores.length === 0 && <p>Todavía no hay trabajadores registrados.</p>}

      <div className="lista">
        {trabajadores.map((trabajador) => (
          <div key={trabajador.id_trabajador} className="caja">
            <h3>{trabajador.nombre}</h3>
            <p>WhatsApp: {trabajador.telefono_whatsapp || 'No registrado'}</p>
            <p>Observaciones: {trabajador.observaciones || 'Sin observaciones'}</p>
            <button className="boton" onClick={() => empezarEdicion(trabajador)}>
              Editar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}