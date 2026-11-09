import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, Info } from 'lucide-react';
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

        try {
          const resAcuerdos = await fetch('http://localhost:3000/api/acuerdos');
          if (resAcuerdos.ok) {
            const dataAcuerdos = await resAcuerdos.json();
            setHistorialAcuerdos(Array.isArray(dataAcuerdos) ? dataAcuerdos : []);
          }
        } catch (e) {
          console.warn('No se pudo precargar historial de acuerdos:', e.message);
        }

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

  const acuerdosDelAuspiciador = auspiciadorSeleccionado
    ? historialAcuerdos.filter(
        (ac) => Number(ac.id_auspiciador) === Number(auspiciadorSeleccionado.id_auspiciador || auspiciadorSeleccionado.id)
      )
    : [];

  const cantCumplidos = acuerdosDelAuspiciador.filter((a) => a.estado === 'CUMPLIDO').length;
  const cantParciales = acuerdosDelAuspiciador.filter((a) => a.estado === 'PARCIAL').length;
  const cantVencidos = acuerdosDelAuspiciador.filter((a) => a.estado === 'VENCIDO' || a.estado === 'INCOBRABLE').length;

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Botón Volver con ícono */}
      <button
        type="button"
        onClick={() => navigate('/auspiciadores')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: '#475569',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          padding: '6px 0',
          marginBottom: '16px'
        }}
      >
        <ArrowLeft size={18} /> Volver a Auspiciadores
      </button>

      {/* Contenedor tipo Tarjeta Oficial */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a', fontWeight: '700' }}>
            Registrar Acuerdo de Auspicio
          </h1>
          <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Establece los compromisos comerciales, aportes y plazos para eventos.
          </p>
        </div>

        {mensaje && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
            fontSize: '14px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: mensaje.includes('éxito') ? '#dcfce7' : '#fee2e2',
            color: mensaje.includes('éxito') ? '#166534' : '#991b1b',
            marginBottom: '20px'
          }}>
            <Info size={18} />
            {mensaje}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            
            {/* Auspiciador */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#334155' }}>Auspiciador:</label>
              <select
                name="id_auspiciador"
                value={formData.id_auspiciador}
                onChange={handleChange}
                required
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: auspiciadorSeleccionado?.clasificacion === 'NO_CONFIABLE' ? '2px solid #ef4444' : '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '14px',
                  color: '#1e293b',
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

            {/* Evento */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#334155' }}>Evento:</label>
              <select
                name="id_evento"
                value={formData.id_evento}
                onChange={handleChange}
                required
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '14px',
                  color: '#1e293b',
                  outline: 'none'
                }}
              >
                <option value="">-- Selecciona un evento --</option>
                {eventos.map((ev) => (
                  <option key={ev.id_evento} value={ev.id_evento}>
                    Evento #{ev.id_evento} - {ev.tipo || ev.nombre || 'Sin título'}
                  </option>
                ))}
              </select>
            </div>

            {/* PANEL DE ADVERTENCIA PARA AUSPICIADOR NO CONFIABLE */}
            {auspiciadorSeleccionado?.clasificacion === 'NO_CONFIABLE' && (
              <div style={{
                gridColumn: '1 / -1',
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                borderLeft: '5px solid #d97706',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 2px 5px rgba(217, 119, 6, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <AlertTriangle size={20} color="#b45309" />
                  <strong style={{ color: '#b45309', fontSize: '14px' }}>
                    Advertencia: Auspiciador clasificado como No Confiable
                  </strong>
                </div>

                <p style={{ margin: '4px 0', fontSize: '13px', color: '#78350f' }}>
                  <strong>Motivo registrado:</strong> {auspiciadorSeleccionado.motivo_clasificacion || 'Sin motivo detallado'}
                </p>

                <div style={{ marginTop: '8px', fontSize: '13px', color: '#92400e' }}>
                  <strong>Historial de cumplimiento:</strong>
                  <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                    <li>Acuerdos cumplidos: <strong>{cantCumplidos}</strong></li>
                    <li>Acuerdos parciales: <strong>{cantParciales}</strong></li>
                    <li>Acuerdos vencidos / incobrables: <strong>{cantVencidos}</strong></li>
                  </ul>
                </div>
              </div>
            )}

            {/* Tipo de Aporte */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#334155' }}>Tipo de Aporte:</label>
              <select
                name="tipo_aporte"
                value={formData.tipo_aporte}
                onChange={handleChange}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '14px',
                  color: '#1e293b',
                  outline: 'none'
                }}
              >
                <option value="DINERO">Dinero</option>
                <option value="CANJE">Canje</option>
              </select>
            </div>

            {/* Monto / Valorización */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#334155' }}>
                {formData.tipo_aporte === 'DINERO' ? 'Monto Comprometido ($):' : 'Valorización del Canje ($):'}
              </label>
              <input
                type="number"
                name="monto_comprometido"
                value={formData.monto_comprometido}
                onChange={handleChange}
                required
                placeholder="Ej: 150000"
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  color: '#1e293b',
                  outline: 'none'
                }}
              />
            </div>

            {formData.tipo_aporte === 'CANJE' && (
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '600', fontSize: '13px', color: '#334155' }}>Descripción del Canje:</label>
                <input
                  type="text"
                  name="descripcion_canje"
                  value={formData.descripcion_canje}
                  onChange={handleChange}
                  placeholder="Ej: Bebidas energéticas para el personal y asistentes"
                  required
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    color: '#1e293b',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            {/* Cantidad de Menciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#334155' }}>Cantidad de Menciones:</label>
              <input
                type="number"
                name="cant_menciones"
                value={formData.cant_menciones}
                onChange={handleChange}
                placeholder="Ej: 3"
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  color: '#1e293b',
                  outline: 'none'
                }}
              />
            </div>

            {/* Fecha de cumplimiento (Texto dinámico según el tipo de aporte) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#334155' }}>
                {formData.tipo_aporte === 'DINERO' ? 'Fecha Límite de Pago:' : 'Fecha Límite de Entrega del Canje:'}
              </label>
              <input
                type="date"
                name="fecha_comprometida"
                value={formData.fecha_comprometida}
                onChange={handleChange}
                required
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  color: '#1e293b',
                  outline: 'none'
                }}
              />
            </div>

            {/* Glosa verbal */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#334155' }}>Glosa del Acuerdo Verbal:</label>
              <textarea
                name="glosa"
                value={formData.glosa}
                onChange={handleChange}
                rows={3}
                placeholder="Especifica condiciones, logos requeridos o detalles acordados verbalmente..."
                required
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  color: '#1e293b',
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
            </div>

          </div>

          {/* Botones de Acción */}
          <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={() => navigate('/auspiciadores')}
              style={{
                padding: '10px 18px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={cargando}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                backgroundColor: '#0d6efd',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                opacity: cargando ? 0.7 : 1
              }}
            >
              <Save size={18} />
              {cargando ? 'Guardando...' : 'Registrar Acuerdo'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}