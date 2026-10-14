import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerAuspiciadores } from '../services/auspiciadorService';
import { registrarAcuerdo } from '../services/acuerdoService';

export default function RegistrarAcuerdoPage() {
  const navigate = useNavigate();

  const [auspiciadores, setAuspiciadores] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  // Estados para la advertencia e historial (RF-P4-03)
  const [auspiciadorSeleccionado, setAuspiciadorSeleccionado] = useState(null);
  const [historialAcuerdos, setHistorialAcuerdos] = useState([]);

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

        // Cargar acuerdos existentes para calcular el historial de cumplimiento
        try {
          const resAcuerdos = await fetch('http://localhost:3000/api/acuerdos');
          if (resAcuerdos.ok) {
            const dataAcuerdos = await resAcuerdos.json();
            setHistorialAcuerdos(Array.isArray(dataAcuerdos) ? dataAcuerdos : []);
          }
        } catch (e) {
          console.warn('No se pudo precargar historial de acuerdos:', e.message);
        }

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

    // Si cambió el auspiciador, detectar su clasificación e historial
    if (name === 'id_auspiciador') {
      const seleccionado = auspiciadores.find(
        (a) => String(a.id_auspiciador || a.id) === String(value)
      );
      setAuspiciadorSeleccionado(seleccionado || null);
    }
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

  // Cálculo de estadísticas de cumplimiento del auspiciador seleccionado
  const acuerdosDelAuspiciador = auspiciadorSeleccionado
    ? historialAcuerdos.filter(
        (ac) => Number(ac.id_auspiciador) === Number(auspiciadorSeleccionado.id_auspiciador || auspiciadorSeleccionado.id)
      )
    : [];

  const cantCumplidos = acuerdosDelAuspiciador.filter((a) => a.estado === 'CUMPLIDO').length;
  const cantParciales = acuerdosDelAuspiciador.filter((a) => a.estado === 'PARCIAL').length;
  const cantVencidos = acuerdosDelAuspiciador.filter((a) => a.estado === 'VENCIDO' || a.estado === 'INCOBRABLE').length;

  return (
    <div style={{ padding: '24px', maxWidth: '650px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <button
        type="button"
        onClick={() => navigate('/auspiciadores')}
        style={{
          backgroundColor: '#6c757d',
          color: 'white',
          padding: '8px 14px',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontWeight: '500'
        }}
      >
        ← Volver
      </button>

      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>Registrar Acuerdo de Auspicio</h2>

      {mensaje && (
        <p style={{
          fontWeight: 'bold',
          padding: '10px 14px',
          borderRadius: '6px',
          backgroundColor: mensaje.includes('éxito') ? '#dcfce7' : '#fee2e2',
          color: mensaje.includes('éxito') ? '#166534' : '#991b1b',
          marginBottom: '16px'
        }}>
          {mensaje}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Selector de Auspiciador */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: '500', fontSize: '14px' }}>Auspiciador:</label>
          <select
            name="id_auspiciador"
            value={formData.id_auspiciador}
            onChange={handleChange}
            required
            style={{
              padding: '10px',
              borderRadius: '6px',
              border: auspiciadorSeleccionado?.clasificacion === 'NO_CONFIABLE' ? '2px solid #ef4444' : '1px solid #cbd5e1',
              outline: 'none'
            }}
          >
            <option value="">-- Selecciona un auspiciador --</option>
            {auspiciadores.map((a) => (
              <option key={a.id_auspiciador || a.id} value={a.id_auspiciador || a.id}>
                {a.nombre} {a.clasificacion === 'NO_CONFIABLE' ? '⚠️ [No confiable]' : ''} {a.rubro ? `(${a.rubro})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* PANEL DE ADVERTENCIA PARA AUSPICIADOR NO CONFIABLE (RF-P4-03) */}
        {auspiciadorSeleccionado?.clasificacion === 'NO_CONFIABLE' && (
          <div style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderLeft: '5px solid #d97706',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 2px 5px rgba(217, 119, 6, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <strong style={{ color: '#b45309', fontSize: '15px' }}>
                Advertencia: Auspiciador clasificado como No Confiable
              </strong>
            </div>

            <p style={{ margin: '4px 0', fontSize: '13px', color: '#78350f' }}>
              <strong>Motivo registrado:</strong> {auspiciadorSeleccionado.motivo_clasificacion || 'Sin motivo detallado'}
            </p>

            <div style={{ marginTop: '10px', fontSize: '13px', color: '#92400e' }}>
              <strong>Historial de cumplimiento:</strong>
              <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                <li>Acuerdos cumplidos: <strong>{cantCumplidos}</strong></li>
                <li>Acuerdos parciales: <strong>{cantParciales}</strong></li>
                <li>Acuerdos vencidos / incobrables: <strong>{cantVencidos}</strong></li>
              </ul>
            </div>

            <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#a16207', fontStyle: 'italic' }}>
              ℹ Puedes continuar con el registro del acuerdo si decides autorizar el compromiso.
            </p>
          </div>
        )}

        {/* Selector de Evento */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: '500', fontSize: '14px' }}>Evento:</label>
          <select
            name="id_evento"
            value={formData.id_evento}
            onChange={handleChange}
            required
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="">-- Selecciona un evento --</option>
            {eventos.map((ev) => (
              <option key={ev.id_evento} value={ev.id_evento}>
                Evento #{ev.id_evento} - {ev.tipo || ev.nombre || 'Sin título'}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de Aporte */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: '500', fontSize: '14px' }}>Tipo de Aporte:</label>
          <select
            name="tipo_aporte"
            value={formData.tipo_aporte}
            onChange={handleChange}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="DINERO">Dinero</option>
            <option value="CANJE">Canje</option>
          </select>
        </div>

        {/* Monto / Valorización */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: '500', fontSize: '14px' }}>
            {formData.tipo_aporte === 'DINERO' ? 'Monto Comprometido ($):' : 'Valorización del Canje ($):'}
          </label>
          <input
            type="number"
            name="monto_comprometido"
            value={formData.monto_comprometido}
            onChange={handleChange}
            required
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        {formData.tipo_aporte === 'CANJE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: '500', fontSize: '14px' }}>Descripción del Canje:</label>
            <input
              type="text"
              name="descripcion_canje"
              value={formData.descripcion_canje}
              onChange={handleChange}
              placeholder="Ej: Bebidas energéticas para el staff"
              required
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
        )}

        {/* Cantidad de Menciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: '500', fontSize: '14px' }}>Cantidad de Menciones:</label>
          <input
            type="number"
            name="cant_menciones"
            value={formData.cant_menciones}
            onChange={handleChange}
            placeholder="Ej: 3"
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        {/* Glosa verbal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: '500', fontSize: '14px' }}>Glosa del Acuerdo Verbal:</label>
          <textarea
            name="glosa"
            value={formData.glosa}
            onChange={handleChange}
            rows={3}
            placeholder="Detalles acordados verbalmente..."
            required
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
          />
        </div>

        {/* Fecha comprometida */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: '500', fontSize: '14px' }}>Fecha Comprometida de Pago:</label>
          <input
            type="date"
            name="fecha_comprometida"
            value={formData.fecha_comprometida}
            onChange={handleChange}
            required
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          style={{
            padding: '12px',
            backgroundColor: '#0d6efd',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '8px',
          }}
        >
          {cargando ? 'Guardando...' : 'Registrar Acuerdo'}
        </button>
      </form>
    </div>
  );
}