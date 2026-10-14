import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerAuspiciadores } from '../services/auspiciadorService';
import { registrarAcuerdo } from '../services/acuerdoService';
import { pedir } from '../services/http';

export default function RegistrarAcuerdoPage() {
  const navigate = useNavigate();

  const [auspiciadores, setAuspiciadores] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const [formData, setFormData] = useState({
    id_auspiciador: '',
    id_evento: '',
    glosa: '',
    tipo_aporte: 'DINERO',
    monto_comprometido: '',
    descripcion_canje: '',
    cant_menciones: '',
    fecha_comprometida: '',
    id_dueno: 1,
  });

useEffect(() => {
  async function cargarDatosIniciales() {
    try {
      const dataAuspiciadores = await obtenerAuspiciadores();
      setAuspiciadores(dataAuspiciadores || []);

      // Simulación temporal hasta que tu compañero suba su módulo de eventos:
      setEventos([
        { id_evento: 1, tipo: 'Torneo Apertura' }
      ]);
    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
    }
  }
  cargarDatosIniciales();
}, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setCargando(true);

    try {
      await registrarAcuerdo(formData);
      setMensaje('Acuerdo registrado con éxito!');
      setTimeout(() => {
        navigate('/auspiciadores');
      }, 1200);
    } catch (err) {
      console.error(err);
      setMensaje(err.message || 'Error al registrar el acuerdo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <button
        type="button"
        onClick={() => navigate('/auspiciadores')}
        style={{
          backgroundColor: '#6c757d',
          color: 'white',
          padding: '8px 14px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        ← Volver
      </button>

      <h2>Registrar Acuerdo de Auspicio</h2>

      {mensaje && (
        <p style={{ fontWeight: 'bold', color: mensaje.includes('éxito') ? '#198754' : '#dc3545' }}>
          {mensaje}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Auspiciador:</label>
          <select
            name="id_auspiciador"
            value={formData.id_auspiciador}
            onChange={handleChange}
            required
            style={{ padding: '8px' }}
          >
            <option value="">-- Selecciona un auspiciador --</option>
            {auspiciadores.map((a) => (
              <option key={a.id_auspiciador} value={a.id_auspiciador}>
                {a.nombre} {a.rubro ? `(${a.rubro})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Evento:</label>
          <select
            name="id_evento"
            value={formData.id_evento}
            onChange={handleChange}
            required
            style={{ padding: '8px' }}
          >
            <option value="">-- Selecciona un evento --</option>
            {eventos.map((ev) => (
              <option key={ev.id_evento} value={ev.id_evento}>
                Evento #{ev.id_evento} - {ev.tipo || ev.nombre || 'Sin título'}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Tipo de Aporte:</label>
          <select
            name="tipo_aporte"
            value={formData.tipo_aporte}
            onChange={handleChange}
            style={{ padding: '8px' }}
          >
            <option value="DINERO">Dinero</option>
            <option value="CANJE">Canje</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>
            {formData.tipo_aporte === 'DINERO' ? 'Monto Comprometido ($):' : 'Valorización del Canje ($):'}
          </label>
          <input
            type="number"
            name="monto_comprometido"
            value={formData.monto_comprometido}
            onChange={handleChange}
            required
            style={{ padding: '8px' }}
          />
        </div>

        {formData.tipo_aporte === 'CANJE' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label>Descripción del Canje:</label>
            <input
              type="text"
              name="descripcion_canje"
              value={formData.descripcion_canje}
              onChange={handleChange}
              placeholder="Ej: Bebidas energéticas para el staff"
              required
              style={{ padding: '8px' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Cantidad de Menciones:</label>
          <input
            type="number"
            name="cant_menciones"
            value={formData.cant_menciones}
            onChange={handleChange}
            placeholder="Ej: 3"
            style={{ padding: '8px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Glosa del Acuerdo Verbal:</label>
          <textarea
            name="glosa"
            value={formData.glosa}
            onChange={handleChange}
            rows={3}
            placeholder="Detalles acordados verbalmente..."
            required
            style={{ padding: '8px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Fecha Comprometida de Pago:</label>
          <input
            type="date"
            name="fecha_comprometida"
            value={formData.fecha_comprometida}
            onChange={handleChange}
            required
            style={{ padding: '8px' }}
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          style={{
            padding: '12px',
            backgroundColor: '#0056b3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '10px',
          }}
        >
          {cargando ? 'Guardando...' : 'Registrar Acuerdo'}
        </button>
      </form>
    </div>
  );
}