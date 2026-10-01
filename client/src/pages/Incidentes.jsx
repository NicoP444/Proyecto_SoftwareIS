import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  registrarIncidente, 
  obtenerIncidentes, 
  obtenerEquipos, 
  obtenerEventos, 
  obtenerTrabajadores 
} from '../services/incidente.service.js';

export default function Incidentes() {
  const navigate = useNavigate();
  const [incidentes, setIncidentes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);

  const [formData, setFormData] = useState({
    codigo: '',
    tipo: 'DANO',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    id_evento: '',
    id_trabajador: '',
    costo_reparacion: '',
  });

  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    cargarDatos();
  }, []);

const cargarDatos = async () => {
    try {
      const resIncidentes = await obtenerIncidentes();
      setIncidentes(resIncidentes?.data || resIncidentes || []);

      try {
        const resEquipos = await obtenerEquipos();
        setEquipos(resEquipos?.data || resEquipos || []);
      } catch (e) {
        console.warn('Endpoint /equipos pendiente');
      }

      try {
        const resEventos = await obtenerEventos();
        setEventos(resEventos?.data || resEventos || []);
      } catch (e) {
        console.warn('Endpoint /eventos pendiente');
      }

      try {
        const resTrabajadores = await obtenerTrabajadores();
        setTrabajadores(resTrabajadores?.data || resTrabajadores || []);
      } catch (e) {
        console.warn('Endpoint /trabajadores pendiente');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEquipoChange = (codigo) => {
    const eq = equipos.find((e) => e.codigo === codigo);
    setEquipoSeleccionado(eq || null);
    setFormData({ ...formData, codigo });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);

    try {
      const payload = {
        ...formData,
        id_evento: formData.id_evento ? Number(formData.id_evento) : null,
        id_trabajador: formData.id_trabajador ? Number(formData.id_trabajador) : null,
        costo_reparacion: formData.tipo === 'DANO' ? Number(formData.costo_reparacion) : undefined,
      };

      await registrarIncidente(payload);
      setMensaje({ tipo: 'exito', texto: 'Incidente registrado con éxito. Estado del equipo actualizado.' });
      
      // Limpiar formulario y recargar lista
      setFormData({
        codigo: '',
        tipo: 'DANO',
        fecha: new Date().toISOString().split('T')[0],
        descripcion: '',
        id_evento: '',
        id_trabajador: '',
        costo_reparacion: '',
      });
      setEquipoSeleccionado(null);
      cargarDatos();
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.message || 'Error al registrar el incidente.',
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '1rem', fontFamily: 'sans-serif' }}>
      <button
        type="button"
        onClick={() => navigate('/home')} //redirige a home
        style={{
          backgroundColor: '#6c757d',
          color: '#ffffff',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '1.5rem',
          fontSize: '14px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        ← Volver al inicio
      </button>

      <h2>Registrar Incidente</h2>
      <p style={{ color: '#666' }}>Formulario para el Jefe de Área Técnica</p>

      {mensaje && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          borderRadius: '4px',
          backgroundColor: mensaje.tipo === 'exito' ? '#d4edda' : '#f8d7da',
          color: mensaje.tipo === 'exito' ? '#155724' : '#721c24'
        }}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px' }}>
        <div>
          <label><strong>Equipo involucrado:</strong></label>
          {equipos.length > 0 ? (
            <select
              value={formData.codigo}
              onChange={(e) => handleEquipoChange(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            >
              <option value="">-- Selecciona un equipo --</option>
              {equipos.map((eq) => (
                <option key={eq.codigo} value={eq.codigo}>
                  {eq.codigo} - {eq.nombre} ({eq.estado})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Código del equipo (ej: CAM-001)"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          )}
        </div>

        <div>
          <label><strong>Tipo de Incidente:</strong></label>
          <select
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          >
            <option value="DANO">Daño (Costo de reparación)</option>
            <option value="PERDIDA">Pérdida (Valor de compra)</option>
            <option value="ROBO">Robo (Valor de compra)</option>
          </select>
        </div>

        {formData.tipo === 'DANO' ? (
          <div>
            <label><strong>Costo Estimado de Reparación ($):</strong></label>
            <input
              type="number"
              placeholder="Ej: 45000"
              value={formData.costo_reparacion}
              onChange={(e) => setFormData({ ...formData, costo_reparacion: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>
        ) : (
          <div style={{ background: '#e9ecef', padding: '0.75rem', borderRadius: '4px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              ℹ️ Se valorizará automáticamente al <strong>valor de compra</strong> del equipo registrado en el sistema.
              {equipoSeleccionado && ` (Valor: $${equipoSeleccionado.valor_compra})`}
            </p>
          </div>
        )}

        <div>
          <label><strong>Fecha del incidente:</strong></label>
          <input
            type="date"
            value={formData.fecha}
            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>

        <div>
          <label><strong>Evento asociado (si corresponde):</strong></label>
          {eventos.length > 0 ? (
            <select
              value={formData.id_evento}
              onChange={(e) => setFormData({ ...formData, id_evento: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            >
              <option value="">-- Fuera de evento / Ninguno --</option>
              {eventos.map((ev) => (
                <option key={ev.id_evento} value={ev.id_evento}>
                  Evento #{ev.id_evento} - {ev.tipo}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              placeholder="ID del Evento (opcional)"
              value={formData.id_evento}
              onChange={(e) => setFormData({ ...formData, id_evento: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          )}
        </div>

        <div>
          <label><strong>Responsable (¿Quién tenía el equipo?):</strong></label>
          {trabajadores.length > 0 ? (
            <select
              value={formData.id_trabajador}
              onChange={(e) => setFormData({ ...formData, id_trabajador: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            >
              <option value="">-- Ninguno / No identificado --</option>
              {trabajadores.map((t) => (
                <option key={t.id_trabajador} value={t.id_trabajador}>
                  {t.nombre}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              placeholder="ID del Trabajador (opcional)"
              value={formData.id_trabajador}
              onChange={(e) => setFormData({ ...formData, id_trabajador: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          )}
        </div>

        <div>
          <label><strong>Descripción del incidente:</strong></label>
          <textarea
            rows="3"
            placeholder="Detalles de cómo ocurrió el hecho..."
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          style={{
            padding: '0.75rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {cargando ? 'Registrando...' : 'Registrar Incidente'}
        </button>
      </form>

      <hr style={{ margin: '2rem 0' }} />

      <h3>Historial de Incidentes Registrados</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }} border="1" cellPadding="8">
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>Fecha</th>
            <th>Equipo</th>
            <th>Tipo</th>
            <th>Valor/Costo</th>
            <th>Responsable</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {incidentes.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>No hay incidentes registrados.</td>
            </tr>
          ) : (
            incidentes.map((inc) => (
              <tr key={inc.id_incidente}>
                <td>{new Date(inc.fecha).toLocaleDateString()}</td>
                <td>{inc.equipo ? `${inc.equipo.nombre} (${inc.codigo})` : inc.codigo}</td>
                <td><strong>{inc.tipo}</strong></td>
                <td>${inc.valor.toLocaleString()}</td>
                <td>{inc.trabajador ? inc.trabajador.nombre : 'No asignado'}</td>
                <td>{inc.descripcion}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}