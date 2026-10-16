import { useState, useEffect } from 'react';
import { 
  registrarIncidente, 
  obtenerIncidentes, 
  obtenerEquipos, 
  obtenerEventos, 
  obtenerTrabajadores 
} from '../services/incidente.service.js';

export default function Incidentes() {
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
    setFormData((prev) => ({ ...prev, codigo }));
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
      
      // Mensaje de éxito limpio sin emojis
      setMensaje({ 
        tipo: 'exito', 
        texto: 'Incidente registrado correctamente. El estado del equipo ha sido actualizado.' 
      });
      
      // Limpiar formulario completo
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

      // Recargar lista para ver reflejado el nuevo incidente
      cargarDatos();
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.message || 'Error al intentar registrar el incidente en el sistema.',
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: '0.2rem' }}>Registrar Incidente Directo</h2>
      <p style={{ color: '#4b5563', fontSize: '0.9rem', marginTop: '0', marginBottom: '1.5rem' }}>
        Reporte de daño, pérdida o robo de equipos en bodega o fuera de un evento
      </p>

      {/* Cartel de retroalimentación sin emojis */}
      {mensaje && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          borderRadius: '4px',
          backgroundColor: mensaje.tipo === 'exito' ? '#e8f5e9' : '#ffebee',
          color: mensaje.tipo === 'exito' ? '#2e7d32' : '#c62828',
          border: `1px solid ${mensaje.tipo === 'exito' ? '#c8e6c9' : '#ffcdd2'}`,
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Fila 1 */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
              Tipo de Incidente:
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            >
              <option value="DANO">Dañado</option>
              <option value="PERDIDA">Perdido</option>
              <option value="ROBO">Robado</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
              Evento (Opcional si fue en bodega):
            </label>
            {eventos.length > 0 ? (
              <select
                value={formData.id_evento}
                onChange={(e) => setFormData({ ...formData, id_evento: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              >
                <option value="">-- Sin evento / Incidente en Bodega --</option>
                {eventos.map((ev) => (
                  <option key={ev.id_evento} value={ev.id_evento}>
                    Evento #{ev.id_evento} - {ev.tipo || ev.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                placeholder="ID del Evento (opcional)"
                value={formData.id_evento}
                onChange={(e) => setFormData({ ...formData, id_evento: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            )}
          </div>
        </div>

        {/* Fila 2 */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
              Código o ID del Equipo:
            </label>
            {equipos.length > 0 ? (
              <select
                value={formData.codigo}
                onChange={(e) => handleEquipoChange(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
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
                placeholder="Ej: CAM-001 o Micrófono..."
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
              Quién tenía el equipo / Responsable:
            </label>
            {trabajadores.length > 0 ? (
              <select
                value={formData.id_trabajador}
                onChange={(e) => setFormData({ ...formData, id_trabajador: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              >
                <option value="">-- Ninguno / Bodega / No identificado --</option>
                {trabajadores.map((t) => (
                  <option key={t.id_trabajador} value={t.id_trabajador}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Nombre del trabajador o Bodeguero..."
                value={formData.id_trabajador}
                onChange={(e) => setFormData({ ...formData, id_trabajador: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            )}
          </div>
        </div>

        {/* Fila 3 */}
        {formData.tipo === 'DANO' ? (
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
              Costo Estimado de Reparación ($):
            </label>
            <input
              type="number"
              placeholder="Ej: 35000"
              value={formData.costo_reparacion}
              onChange={(e) => setFormData({ ...formData, costo_reparacion: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
        ) : (
          <div style={{ background: '#f3f4f6', padding: '0.75rem', borderRadius: '4px', borderLeft: '4px solid #333c87' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#374151' }}>
              Se valorizará automáticamente al <strong>valor de compra</strong> registrado en el sistema.
              {equipoSeleccionado && ` (Valor inventario: $${equipoSeleccionado.valor_compra})`}
            </p>
          </div>
        )}

        {/* Fila 4 */}
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
            Descripción del Incidente:
          </label>
          <textarea
            rows="3"
            placeholder="Detalla qué sucedió con el equipo..."
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            required
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>

        {/* Botón de envío */}
        <button
          type="submit"
          disabled={cargando}
          style={{
            backgroundColor: '#333c87',
            color: 'white',
            border: 'none',
            padding: '0.75rem',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: cargando ? 'not-allowed' : 'pointer',
            fontSize: '0.95rem',
            marginTop: '0.5rem'
          }}
        >
          {cargando ? 'Registrando...' : 'Registrar Incidente en Sistema'}
        </button>
      </form>

      {/* Historial de Incidentes Registrados */}
      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Historial de Incidentes Registrados</h3>
        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
                <th style={{ padding: '0.75rem' }}>Fecha</th>
                <th style={{ padding: '0.75rem' }}>Equipo</th>
                <th style={{ padding: '0.75rem' }}>Tipo</th>
                <th style={{ padding: '0.75rem' }}>Valor/Costo</th>
                <th style={{ padding: '0.75rem' }}>Responsable</th>
                <th style={{ padding: '0.75rem' }}>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {incidentes.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
                    No hay incidentes registrados.
                  </td>
                </tr>
              ) : (
                incidentes.map((inc) => (
                  <tr key={inc.id_incidente} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem' }}>{new Date(inc.fecha).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem' }}><strong>{inc.codigo}</strong> {inc.equipo?.nombre ? `(${inc.equipo.nombre})` : ''}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        backgroundColor: inc.tipo === 'DANO' ? '#fef3c7' : '#fee2e2',
                        color: inc.tipo === 'DANO' ? '#b45309' : '#b91c1c'
                      }}>
                        {inc.tipo === 'DANO' ? 'DAÑO' : inc.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>${Number(inc.valor || 0).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem' }}>{inc.trabajador?.nombre || 'No asignado'}</td>
                    <td style={{ padding: '0.75rem', color: '#4b5563' }}>{inc.descripcion}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}