import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  registrarAuspiciador,
  obtenerAuspiciadores,
  modificarAuspiciador,
  eliminarAuspiciador
} from '../services/auspiciadorService';

export default function Auspiciadores() {
  const navigate = useNavigate();

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    rubro: '',
    contacto: '',
    telefono: '',
    id_dueno: 1
  });

  // Estado para saber si estamos editando (guarda el id_auspiciador)
  const [idEditando, setIdEditando] = useState(null);

  const [mensaje, setMensaje] = useState('');
  const [listaAuspiciadores, setListaAuspiciadores] = useState([]);

  // Cargar lista desde la base de datos
  const cargarLista = async () => {
    try {
      const data = await obtenerAuspiciadores();
      setListaAuspiciadores(data || []);
    } catch (error) {
      console.error('Error al cargar lista:', error);
    }
  };

  useEffect(() => {
    cargarLista();
  }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Función al presionar "Editar" en una tarjeta
  const iniciarEdicion = (item) => {
    setIdEditando(item.id_auspiciador || item.id);
    setFormData({
      nombre: item.nombre || '',
      rubro: item.rubro || '',
      contacto: item.contacto || '',
      telefono: item.telefono || '',
      id_dueno: item.id_dueno || 1
    });
    setMensaje('');
    // Scrollear hacia arriba suavemente para ver el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancelar modo edición
  const cancelarEdicion = () => {
    setIdEditando(null);
    setFormData({
      nombre: '',
      rubro: '',
      contacto: '',
      telefono: '',
      id_dueno: 1
    });
    setMensaje('');
  };

  // Guardar (Crear o Actualizar)
  const manejarEnvio = async (e) => {
    e.preventDefault();
    setMensaje("Guardando...");

    try {
      if (idEditando) {
        // Modo modificación
        await modificarAuspiciador(idEditando, formData);
        setMensaje("Auspiciador actualizado con éxito!");
      } else {
        // Modo creación
        await registrarAuspiciador(formData);
        setMensaje("Auspiciador registrado con éxito!");
      }

      cancelarEdicion();
      cargarLista();
    } catch (error) {
      console.error(error);
      setMensaje(error.message || "Hubo un error al guardar. Revisa la consola.");
    }
  };

  // Eliminar auspiciador (valida si tiene acuerdos mediante la respuesta del backend)
  const manejarEliminar = async (id) => {
    const confirmar = window.confirm("¿Seguro que deseas eliminar este auspiciador?");
    if (!confirmar) return;

    try {
      await eliminarAuspiciador(id);
      setMensaje("Auspiciador eliminado con éxito.");
      cargarLista();
    } catch (error) {
      console.error(error);
      // Muestra el mensaje de la regla de negocio que arrojó tu service backend
      alert(error.message || "No se puede eliminar el auspiciador.");
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <button
        type="button"
        onClick={() => navigate('/home')}
        style={{
          backgroundColor: '#6c757d',
          color: 'white',
          padding: '8px 14px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontSize: '14px'
        }}
      >
        ← Volver al Home
      </button>

      <h1>{idEditando ? 'Modificar Auspiciador' : 'Registrar Auspiciador'}</h1>

      {mensaje && (
        <p style={{
          fontWeight: 'bold',
          color: mensaje.includes('éxito') ? '#198754' : '#dc3545'
        }}>
          {mensaje}
        </p>
      )}

      {/* FORMULARIO */}
      <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Nombre del Auspiciador:</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={manejarCambio}
            required
            style={{ padding: '8px', fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Rubro:</label>
          <input
            type="text"
            name="rubro"
            value={formData.rubro}
            onChange={manejarCambio}
            required
            style={{ padding: '8px', fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Nombre del Contacto:</label>
          <input
            type="text"
            name="contacto"
            value={formData.contacto}
            onChange={manejarCambio}
            required
            style={{ padding: '8px', fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Teléfono:</label>
          <input
            type="text"
            name="telefono"
            value={formData.telefono}
            onChange={manejarCambio}
            required
            style={{ padding: '8px', fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '16px',
              backgroundColor: idEditando ? '#28a745' : '#0056b3',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {idEditando ? 'Guardar Cambios' : 'Guardar Auspiciador'}
          </button>

          {idEditando && (
            <button
              type="button"
              onClick={cancelarEdicion}
              style={{
                padding: '10px 16px',
                fontSize: '16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* LISTA DE AUSPICIADORES */}
      <div style={{ marginTop: '40px' }}>
        <h2>Lista de auspiciadores</h2>

        {listaAuspiciadores.length === 0 ? (
          <p style={{ color: '#6c757d' }}>No hay auspiciadores registrados aún.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            {listaAuspiciadores.map((item) => {
              const id = item.id_auspiciador || item.id;
              return (
                <div
                  key={id}
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{item.nombre}</h3>
                  <p style={{ margin: '4px 0' }}><strong>Rubro:</strong> {item.rubro}</p>
                  <p style={{ margin: '4px 0' }}><strong>Contacto:</strong> {item.contacto}</p>
                  <p style={{ margin: '4px 0' }}><strong>Teléfono:</strong> {item.telefono}</p>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => iniciarEdicion(item)}
                      style={{
                        backgroundColor: '#1b2a4a',
                        color: 'white',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => manejarEliminar(id)}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}