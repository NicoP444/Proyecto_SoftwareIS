import React, { useState, useEffect } from 'react';
import { 
  registrarIncidente, 
  obtenerIncidentes, 
  obtenerEquipos, 
  obtenerEventos, 
  obtenerTrabajadores 
} from '../services/incidente.service.js';
import { obtenerKitsPorEvento } from '../services/salidaKit.service.js';

export default function Incidentes() {
  const [incidentes, setIncidentes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);

  const [equiposDelEvento, setEquiposDelEvento] = useState([]);
  const [responsableAutoDetectado, setResponsableAutoDetectado] = useState(false);

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
      const listaInc = resIncidentes?.data || resIncidentes || [];
      setIncidentes(Array.isArray(listaInc) ? listaInc : []);

      try {
        const resEquipos = await obtenerEquipos();
        const listaEq = resEquipos?.data || resEquipos || [];
        setEquipos(Array.isArray(listaEq) ? listaEq : []);
      } catch (e) {
        console.warn('Endpoint /equipos pendiente');
      }

      try {
        const resEventos = await obtenerEventos();
        const listaEv = resEventos?.data || resEventos || [];
        setEventos(Array.isArray(listaEv) ? listaEv : []);
      } catch (e) {
        console.warn('Endpoint /eventos pendiente');
      }

      try {
        const resTrabajadores = await obtenerTrabajadores();
        const listaTrab = resTrabajadores?.data || resTrabajadores || [];
        setTrabajadores(Array.isArray(listaTrab) ? listaTrab : []);
      } catch (e) {
        console.warn('Endpoint /trabajadores pendiente');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEventoChange = async (idEvento) => {
    setFormData((prev) => ({ ...prev, id_evento: idEvento, codigo: '', id_trabajador: '' }));
    setEquipoSeleccionado(null);
    setResponsableAutoDetectado(false);

    if (!idEvento) {
      setEquiposDelEvento([]);
      return;
    }

    try {
      const res = await obtenerKitsPorEvento(idEvento);
      const data = res?.data || res;
      const reservas = data?.reservas || [];

      const listaFiltrada = [];
      reservas.forEach((r) => {
        const respTrabajador = r.salida?.responsable?.trabajador || null;
        const nombreKit = r.kit?.nombre || 'Kit';
        (r.kit?.equipos || []).forEach((eq) => {
          listaFiltrada.push({
            ...eq,
            nombreKit,
            trabajadorResponsable: respTrabajador,
          });
        });
      });

      setEquiposDelEvento(listaFiltrada);
    } catch (error) {
      console.error('Error al filtrar equipos del evento:', error);
      setEquiposDelEvento([]);
    }
  };

  const handleEquipoChange = (codigo) => {
    const listaActual = formData.id_evento ? equiposDelEvento : equipos;
    const eq = listaActual.find((e) => e.codigo === codigo);
    setEquipoSeleccionado(eq || null);

    if (eq?.trabajadorResponsable) {
      setFormData((prev) => ({
        ...prev,
        codigo,
        id_trabajador: String(eq.trabajadorResponsable.id_trabajador),
      }));
      setResponsableAutoDetectado(true);
    } else {
      setFormData((prev) => ({
        ...prev,
        codigo,
        id_trabajador: formData.id_evento ? '' : prev.id_trabajador,
      }));
      setResponsableAutoDetectado(false);
    }
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
      
      setMensaje({ 
        tipo: 'exito', 
        texto: 'Incidente registrado correctamente. El estado del equipo ha sido actualizado.' 
      });
      
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
      setEquiposDelEvento([]);
      setResponsableAutoDetectado(false);

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

  // Badge institucional para incidentes (110px de ancho fijo)
  const renderBadgeIncidente = (tipo) => {
    let bg = '#fee2e2';
    let text = '#dc2626';
    let label = tipo;

    switch (tipo) {
      case 'DANO':
        label = 'Dañado';
        bg = '#fef3c7';
        text = '#b45309';
        break;
      case 'PERDIDA':
        label = 'Perdido';
        bg = '#fee2e2';
        text = '#dc2626';
        break;
      case 'ROBO':
        label = 'Robado';
        bg = '#fee2e2';
        text = '#991b1b';
        break;
      default:
        break;
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          width: '110px',
          minWidth: '110px',
          maxWidth: '110px',
          height: '24px',
          padding: '0 8px',
          boxSizing: 'border-box',
          borderRadius: '9999px',
          fontSize: '0.72rem',
          fontWeight: '700',
          lineHeight: '1',
          whiteSpace: 'nowrap',
          backgroundColor: bg,
          color: text,
          letterSpacing: '0.02em',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: text,
            flexShrink: 0,
          }}
        />
        <span>{label}</span>
      </span>
    );
  };

  const listaEquiposMostrados = formData.id_evento ? equiposDelEvento : equipos;

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>
          Registro de Incidentes
        </h3>
      </div>

      {mensaje && (
        <div
          style={{
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: '500',
            backgroundColor: mensaje.tipo === 'exito' ? '#dcfce7' : '#fee2e2',
            color: mensaje.tipo === 'exito' ? '#15803d' : '#991b1b',
            border: mensaje.tipo === 'exito' ? '1px solid #bbf7d0' : '1px solid #fecaca',
          }}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Formulario de registro */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#ffffff', padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '1.75rem' }}>
        {/* Fila 1: Tipo y Evento */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tipo de Incidente
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                fontSize: '0.88rem',
                color: '#0f172a',
                boxSizing: 'border-box',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="DANO">Dañado</option>
              <option value="PERDIDA">Perdido</option>
              <option value="ROBO">Robado</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Evento Asociado
            </label>
            {eventos.length > 0 ? (
              <select
                value={formData.id_evento}
                onChange={(e) => handleEventoChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  boxSizing: 'border-box',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">-- Sin evento / Incidente en Bodega --</option>
                {eventos.map((ev) => (
                  <option key={ev.id_evento} value={ev.id_evento}>
                    Evento #{ev.id_evento} - {ev.tipo || 'Transmisión'}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                placeholder="ID del Evento (opcional)"
                value={formData.id_evento}
                onChange={(e) => handleEventoChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            )}
          </div>
        </div>

        {/* Fila 2: Equipo y Responsable */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Equipo Afectado
            </label>
            {equipos.length > 0 || formData.id_evento ? (
              <select
                value={formData.codigo}
                onChange={(e) => handleEquipoChange(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  boxSizing: 'border-box',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">
                  {formData.id_evento && listaEquiposMostrados.length === 0
                    ? '-- Este evento no tiene equipos en kits reservados --'
                    : '-- Selecciona un equipo --'}
                </option>
                {listaEquiposMostrados.map((eq) => (
                  <option key={eq.codigo} value={eq.codigo}>
                    {eq.codigo} - {eq.nombre}{eq.nombreKit ? ` (${eq.nombreKit})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Ej: CAM-001..."
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Trabajador Responsable
            </label>
            {trabajadores.length > 0 || equipoSeleccionado?.trabajadorResponsable ? (
              <select
                value={formData.id_trabajador}
                onChange={(e) => {
                  setFormData({ ...formData, id_trabajador: e.target.value });
                  setResponsableAutoDetectado(false);
                }}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  boxSizing: 'border-box',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">-- Ninguno / Bodega / No identificado --</option>
                {equipoSeleccionado?.trabajadorResponsable &&
                  !trabajadores.some(
                    (t) => String(t.id_trabajador) === String(equipoSeleccionado.trabajadorResponsable.id_trabajador)
                  ) && (
                    <option value={equipoSeleccionado.trabajadorResponsable.id_trabajador}>
                      {equipoSeleccionado.trabajadorResponsable.nombre}
                    </option>
                  )}
                {trabajadores.map((t) => (
                  <option key={t.id_trabajador} value={t.id_trabajador}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="ID del trabajador (opcional)..."
                value={formData.id_trabajador}
                onChange={(e) => setFormData({ ...formData, id_trabajador: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            )}
            {responsableAutoDetectado && (
              <span style={{ fontSize: '0.78rem', color: '#15803d', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                ✓ Asignado automáticamente según salida de {equipoSeleccionado?.nombreKit}
              </span>
            )}
          </div>
        </div>

        {/* Fila 3: Costo o valorización */}
        {formData.tipo === 'DANO' ? (
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Costo Estimado de Reparación ($)
            </label>
            <input
              type="number"
              min="0"
              placeholder="Ej: 35000"
              value={formData.costo_reparacion}
              onChange={(e) => setFormData({ ...formData, costo_reparacion: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                fontSize: '0.88rem',
                color: '#0f172a',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
        ) : (
          <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', borderLeft: '4px solid #333c87', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.85rem', color: '#475569' }}>
              La pérdida o robo se valorizará automáticamente según el <strong>valor de compra</strong> registrado en inventario.
              {equipoSeleccionado && ` (Valor activo: $${Number(equipoSeleccionado.valor_compra || 0).toLocaleString('es-CL')})`}
            </span>
          </div>
        )}

        {/* Fila 4: Descripción */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Descripción del Incidente
          </label>
          <textarea
            rows="3"
            maxLength={255}
            placeholder="Detalla qué sucedió con el equipo..."
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '0.6rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '0.88rem',
              color: '#0f172a',
              boxSizing: 'border-box',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Botón de envío */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.25rem' }}>
          <button
            type="submit"
            disabled={cargando}
            style={{
              padding: '0.65rem 1.4rem',
              backgroundColor: '#333c87',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.88rem',
              fontWeight: '600',
              cursor: cargando ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => !cargando && (e.currentTarget.style.backgroundColor = '#272e6b')}
            onMouseLeave={(e) => !cargando && (e.currentTarget.style.backgroundColor = '#333c87')}
          >
            {cargando ? 'Registrando...' : 'Registrar Incidente'}
          </button>
        </div>
      </form>

      {/* Historial de Incidentes Registrados */}
      <div>
        <div style={{ marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>
            Historial de Incidentes Registrados
          </h3>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '280px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 1 }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>FECHA</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>EQUIPO</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>TIPO</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>VALOR / COSTO</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>RESPONSABLE</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>DESCRIPCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {incidentes.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    No hay incidentes registrados en el sistema.
                  </td>
                </tr>
              ) : (
                incidentes.map((inc) => (
                  <tr key={inc.id_incidente} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '0.85rem 0.5rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(inc.fecha).toLocaleDateString('es-CL')}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', color: '#0f172a' }}>
                      <strong>{inc.codigo}</strong>
                      {inc.equipo?.nombre && (
                        <span style={{ color: '#64748b', fontSize: '0.82rem', marginLeft: '6px' }}>
                          ({inc.equipo.nombre})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      {renderBadgeIncidente(inc.tipo)}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: '700', color: '#0f172a' }}>
                      ${Number(inc.valor || 0).toLocaleString('es-CL')}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', color: '#334155' }}>
                      {inc.trabajador?.nombre || 'Bodega / General'}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', color: '#64748b' }}>
                      {inc.descripcion}
                    </td>
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