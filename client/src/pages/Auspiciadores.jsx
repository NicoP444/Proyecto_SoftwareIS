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

  // Estado del formulario de auspiciador
  const [formData, setFormData] = useState({
    nombre: '',
    rubro: '',
    contacto: '',
    telefono: '',
    id_dueno: 1
  });

  const [idEditando, setIdEditando] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Listas de datos
  const [listaAcuerdos, setListaAcuerdos] = useState([]);
  const [cargandoAcuerdos, setCargandoAcuerdos] = useState(true);
  const [listaAuspiciadores, setListaAuspiciadores] = useState([]);

  // Estado para el modal de cambio de clasificación (RF-P4-07)
  const [modalClasificacion, setModalClasificacion] = useState({
    abierto: false,
    auspiciador: null,
    nuevoEstado: '',
    motivo: ''
  });

  // 1. Cargar acuerdos registrados
  const cargarAcuerdos = async () => {
    try {
      setCargandoAcuerdos(true);
      const res = await fetch('http://localhost:3000/api/acuerdos');
      if (!res.ok) throw new Error('Error al obtener acuerdos');
      const data = await res.json();
      setListaAcuerdos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Aviso al cargar acuerdos:', error.message);
      setListaAcuerdos([]);
    } finally {
      setCargandoAcuerdos(false);
    }
  };

  // 2. Cargar auspiciadores registrados
  const cargarAuspiciadores = async () => {
    try {
      const data = await obtenerAuspiciadores();
      setListaAuspiciadores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Aviso al cargar auspiciadores:', error.message);
      setListaAuspiciadores([]);
    }
  };

  useEffect(() => {
    cargarAcuerdos();
    cargarAuspiciadores();
  }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const iniciarEdicion = (item) => {
    setMostrarFormulario(true);
    setIdEditando(item.id_auspiciador || item.id);
    setFormData({
      nombre: item.nombre || '',
      rubro: item.rubro || '',
      contacto: item.contacto || '',
      telefono: item.telefono || '',
      id_dueno: item.id_dueno || 1
    });
    setMensaje('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setMensaje("Guardando...");

    try {
      if (idEditando) {
        await modificarAuspiciador(idEditando, formData);
        setMensaje("Auspiciador actualizado con éxito!");
      } else {
        await registrarAuspiciador(formData);
        setMensaje("Auspiciador registrado con éxito!");
      }

      cancelarEdicion();
      cargarAuspiciadores();
    } catch (error) {
      console.error(error);
      setMensaje(error.message || "Hubo un error al guardar.");
    }
  };

  const manejarEliminar = async (id) => {
    const confirmar = window.confirm("¿Seguro que deseas eliminar este auspiciador?");
    if (!confirmar) return;

    try {
      await eliminarAuspiciador(id);
      setMensaje("Auspiciador eliminado con éxito.");
      cargarAuspiciadores();
    } catch (error) {
      console.error(error);
      alert(error.message || "No se puede eliminar el auspiciador.");
    }
  };

  // Abre el modal al hacer clic en el badge
  const abrirModalCambio = (item) => {
    const esNoConfiable = item.clasificacion === 'NO_CONFIABLE';
    setModalClasificacion({
      abierto: true,
      auspiciador: item,
      nuevoEstado: esNoConfiable ? 'CONFIABLE' : 'NO_CONFIABLE',
      motivo: item.motivo_clasificacion || ''
    });
  };

  // Guarda la nueva clasificación con el motivo en el backend
  const confirmarCambioClasificacion = async (e) => {
    e.preventDefault();
    const { auspiciador, nuevoEstado, motivo } = modalClasificacion;
    const id = auspiciador.id_auspiciador || auspiciador.id;

    try {
      const res = await fetch(`http://localhost:3000/api/auspiciadores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...auspiciador,
          clasificacion: nuevoEstado,
          motivo_clasificacion: motivo
        })
      });

      if (!res.ok) throw new Error('No se pudo actualizar');

      setMensaje(`Clasificación de ${auspiciador.nombre} cambiada a ${nuevoEstado}.`);
      setModalClasificacion({ abierto: false, auspiciador: null, nuevoEstado: '', motivo: '' });
      cargarAuspiciadores();
    } catch (error) {
      alert('Error al actualizar: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '30px 20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Botones de navegación superiores */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => navigate('/home')}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '9px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ← Volver al Home
        </button>

        <button
          type="button"
          onClick={() => navigate('/auspiciadores/registrar-acuerdo')}
          style={{
            backgroundColor: '#0d6efd',
            color: 'white',
            padding: '9px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          + Registrar acuerdo
        </button>

        <button
          type="button"
          onClick={() => {
            if (mostrarFormulario) cancelarEdicion();
            setMostrarFormulario(!mostrarFormulario);
          }}
          style={{
            backgroundColor: mostrarFormulario ? '#dc3545' : '#198754',
            color: 'white',
            padding: '9px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {mostrarFormulario ? '✕ Cerrar formulario' : '+ Registrar auspiciador'}
        </button>
      </div>

      {/* VISTA 1: MODO REGISTRAR/GESTIONAR AUSPICIADORES */}
      {mostrarFormulario ? (
        <div>
          {/* Formulario */}
          <div style={{
            marginBottom: '35px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '18px', fontSize: '20px' }}>
              {idEditando ? 'Modificar Auspiciador' : 'Registrar Auspiciador'}
            </h2>

            {mensaje && (
              <p style={{
                fontWeight: 'bold',
                color: mensaje.includes('éxito') || mensaje.includes('cambiada') ? '#198754' : '#dc3545',
                marginBottom: '15px'
              }}>
                {mensaje}
              </p>
            )}

            <form onSubmit={manejarEnvio} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500' }}>Nombre del Auspiciador:</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={manejarCambio}
                  required
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500' }}>Rubro:</label>
                <input
                  type="text"
                  name="rubro"
                  value={formData.rubro}
                  onChange={manejarCambio}
                  required
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500' }}>Nombre del Contacto:</label>
                <input
                  type="text"
                  name="contacto"
                  value={formData.contacto}
                  onChange={manejarCambio}
                  required
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500' }}>Teléfono:</label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={manejarCambio}
                  required
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: idEditando ? '#28a745' : '#0056b3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {idEditando ? 'Guardar Cambios' : 'Guardar Auspiciador'}
                </button>

                <button
                  type="button"
                  onClick={cancelarEdicion}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>

          {/* Lista de Auspiciadores registrados */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>
              Auspiciadores Registrados
            </h3>

            {listaAuspiciadores.length === 0 ? (
              <p style={{ color: '#64748b' }}>No hay auspiciadores registrados aún.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {listaAuspiciadores.map((item) => {
                  const id = item.id_auspiciador || item.id;
                  const esNoConfiable = item.clasificacion === 'NO_CONFIABLE';

                  return (
                    <div
                      key={id}
                      style={{
                        border: esNoConfiable ? '1px solid #fca5a5' : '1px solid #dee2e6',
                        borderRadius: '10px',
                        padding: '16px',
                        backgroundColor: esNoConfiable ? '#fffdfd' : '#ffffff',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{item.nombre}</h4>
                        
                        {/* BOTÓN/BADGE INTERACTIVO */}
                        <button
                          type="button"
                          onClick={() => abrirModalCambio(item)}
                          title="Haz clic para cambiar la clasificación"
                          style={{
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '14px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: esNoConfiable ? '#fee2e2' : '#dcfce7',
                            color: esNoConfiable ? '#991b1b' : '#166534',
                            transition: 'opacity 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          {esNoConfiable ? '⚠️ No confiable' : '✓ Confiable'}
                        </button>
                      </div>

                      <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Rubro:</strong> {item.rubro}</p>
                      <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Contacto:</strong> {item.contacto}</p>
                      <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Teléfono:</strong> {item.telefono}</p>

                      {item.motivo_clasificacion && (
                        <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                          <strong>Motivo:</strong> {item.motivo_clasificacion}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                        <button
                          type="button"
                          onClick={() => iniciarEdicion(item)}
                          style={{
                            backgroundColor: '#1b2a4a',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => manejarEliminar(id)}
                          style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px'
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
      ) : (
        /* VISTA 2: PORTADA PRINCIPAL */
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>Acuerdos de Auspicio</h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
              Acuerdos por evento, glosa y estado de pago
            </p>
          </div>

          {cargandoAcuerdos ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>Cargando acuerdos...</p>
          ) : listaAcuerdos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 15px', color: '#64748b' }}>
              <p style={{ margin: 0 }}>No hay acuerdos registrados todavía.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 14px' }}>Auspiciador</th>
                    <th style={{ padding: '12px 14px' }}>Evento</th>
                    <th style={{ padding: '12px 14px' }}>Tipo de Pago</th>
                    <th style={{ padding: '12px 14px' }}>Glosa</th>
                    <th style={{ padding: '12px 14px' }}>Plazo</th>
                    <th style={{ padding: '12px 14px' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {listaAcuerdos.map((item) => {
                    const id = item.id_acuerdo || item.id;
                    const nombreAuspiciador = item.auspiciador?.nombre || `Auspiciador #${item.id_auspiciador || '-'}`;
                    const nombreEvento = item.evento?.tipo || item.evento?.nombre || `Evento #${item.id_evento || '-'}`;
                    const tipoPago = item.tipo_aporte || item.tipo_pago || 'Aporte';
                    const detalleMonto = item.monto_comprometido || item.monto 
                      ? ` — $${Number(item.monto_comprometido || item.monto).toLocaleString('es-CL')}` 
                      : '';
                    const fechaPlazo = item.fecha_comprometida || item.fecha_limite 
                      ? new Date(item.fecha_comprometida || item.fecha_limite).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
                      : '--';

                    return (
                      <tr key={id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px', fontWeight: '600', color: '#1e293b' }}>
                          {nombreAuspiciador}
                        </td>
                        <td style={{ padding: '14px', color: '#334155' }}>
                          {nombreEvento}
                        </td>
                        <td style={{ padding: '14px', color: '#334155' }}>
                          {tipoPago}{detalleMonto}
                        </td>
                        <td style={{ padding: '14px', color: '#64748b', maxWidth: '240px' }}>
                          {item.glosa || 'Sin glosa'}
                        </td>
                        <td style={{ padding: '14px', color: '#334155', whiteSpace: 'nowrap' }}>
                          {fechaPlazo}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{
                            backgroundColor: '#e6f4ea',
                            color: '#137333',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'inline-block'
                          }}>
                            {item.estado || 'PENDIENTE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL LIMPIO INTEGRADO PARA CAMBIAR CLASIFICACIÓN (RF-P4-07) */}
      {modalClasificacion.abierto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '18px', color: '#0f172a' }}>
              Cambiar clasificación a: {modalClasificacion.nuevoEstado === 'NO_CONFIABLE' ? '⚠️ No Confiable' : '✓ Confiable'}
            </h3>
            
            <p style={{ margin: '0 0 14px 0', fontSize: '14px', color: '#64748b' }}>
              Auspiciador: <strong>{modalClasificacion.auspiciador?.nombre}</strong>
            </p>

            {modalClasificacion.nuevoEstado === 'NO_CONFIABLE' && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '14px',
                fontSize: '13px',
                color: '#991b1b'
              }}>
                Al marcarlo como <strong>No Confiable</strong>, el sistema advertirá en rojo al agendar futuros acuerdos de auspicio con él[cite: 22, 30].
              </div>
            )}

            <form onSubmit={confirmarCambioClasificacion}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#334155' }}>
                Motivo del cambio (requerido):
              </label>
              <textarea
                value={modalClasificacion.motivo}
                onChange={(e) => setModalClasificacion({ ...modalClasificacion, motivo: e.target.value })}
                placeholder="Ej: Retraso reiterado de pagos o incumplimiento de aportes..."
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalClasificacion({ abierto: false, auspiciador: null, nuevoEstado: '', motivo: '' })}
                  style={{
                    backgroundColor: '#e2e8f0',
                    color: '#334155',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: modalClasificacion.nuevoEstado === 'NO_CONFIABLE' ? '#dc2626' : '#166534',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Guardar Clasificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}