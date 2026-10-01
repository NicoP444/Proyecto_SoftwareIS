/// client/src/pages/AuspiciadoresPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Importamos el hook de navegación
import { registrarAuspiciador } from '../services/auspiciadorService'; // Importamos el "cable" que hicimos

export default function Auspiciadores() {
  const navigate = useNavigate(); // 2. Inicializamos la navegación

  // Aquí guardamos temporalmente lo que el usuario escribe en las cajitas (Estado)
  const [formData, setFormData] = useState({
    nombre: '',
    rubro: '',
    contacto: '',
    telefono: '',
    id_dueno: 1 // Lo dejamos en 1 temporalmente para la prueba, como vimos con Postman
  });

  const [mensaje, setMensaje] = useState(''); // Para mostrar avisos de éxito o error

  // Esta función se ejecuta cada vez que el usuario teclea algo
  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Esta función se ejecuta cuando el usuario presiona "Guardar"
  const manejarEnvio = async (e) => {
    e.preventDefault(); // Evita que la página se recargue sola
    setMensaje("Enviando...");

    try {
      // Usamos nuestro servicio para mandar los datos al backend
      await registrarAuspiciador(formData);
      setMensaje(" Auspiciador registrado con éxito!");

      // Limpiamos el formulario
      setFormData({ nombre: '', rubro: '', contacto: '', telefono: '', id_dueno: 1 });
    } catch (error) {
      setMensaje(" Hubo un error al registrar. Revisa la consola.");
    }
  };

  // Esta es la parte visual (HTML mezclado con JavaScript)
  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* 3. Botón para volver al inicio */}
      <button 
        type="button" 
        onClick={() => navigate('/home')} //redirige a home
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
        ← Volver al inicio
      </button>

      <h1>Registrar Auspiciador</h1>

      {/* Mostramos el mensaje si es que hay uno */}
      {mensaje && <p style={{ fontWeight: 'bold' }}>{mensaje}</p>}

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

        <button 
          type="submit"
          style={{ padding: '10px', fontSize: '16px', backgroundColor: '#0056b3', color: 'white', border: 'none', cursor: 'pointer', marginTop: '10px' }}
        >
          Guardar Auspiciador
        </button>

      </form>
    </div>
  );
}