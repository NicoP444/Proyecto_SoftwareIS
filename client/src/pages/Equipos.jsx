import { useState, useEffect } from 'react';
import {
  obtenerEquipos,
  registrarEquipo,
  actualizarEquipo,
  darDeBajaEquipo,
  eliminarEquipo
} from '../services/equipoService';

export default function Equipos() {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'CAMARA',
    marca: '',
    modelo: '',
    fecha_compra: new Date().toISOString().split('T')[0],
    valor_compra: '',
    id_jefe: 1
  });

  const [listaEquipos, setListaEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Estado para el modal de edición (RF-P5-02)
  const [equipoEditando, setEquipoEditando] = useState(null);

  // Estados para el modal de dar de baja (RF-P5-03)
  const [equipoBaja, setEquipoBaja] = useState(null);
  const [motivoBaja, setMotivoBaja] = useState('');

  const cargarEquipos = async () => {
    try {
      setCargando(true);
      const data = await obtenerEquipos();
      setListaEquipos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Error al cargar equipos:', error.message);
      setListaEquipos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEquipos();
  }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setMensaje('Registrando equipo...');

    try {
      await registrarEquipo({
        ...formData,
        valor_compra: Number(formData.valor_compra)
      });

      setMensaje('¡Equipo registrado con éxito en inventario!');
      setFormData({
        nombre: '',
        categoria: 'CAMARA',
        marca: '',
        modelo: '',
        fecha_compra: new Date().toISOString().split('T')[0],
        valor_compra: '',
        id_jefe: 1
      });
      cargarEquipos();
    } catch (error) {
      console.error(error);
      setMensaje(error.message || 'Error al registrar el equipo.');
    }
  };

  // Abrir formulario de edición con los datos del equipo seleccionado (RF-P5-02)
  const iniciarEdicion = (eq) => {
    setEquipoEditando({
      ...eq,
      fecha_compra: eq.fecha_compra ? eq.fecha_compra.split('T')[0] : '',
      valor_compra: eq.valor_compra ?? ''
    });
  };

  const manejarCambioEdicion = (e) => {
    const { name, value } = e.target;
    setEquipoEditando({ ...equipoEditando, [name]: value });
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    try {
      await actualizarEquipo(equipoEditando.codigo, {
        nombre: equipoEditando.nombre,
        categoria: equipoEditando.categoria,
        marca: equipoEditando.marca || null,
        modelo: equipoEditando.modelo || null,
        fecha_compra: equipoEditando.fecha_compra,
        valor_compra: Number(equipoEditando.valor_compra)
      });

      setMensaje('¡Equipo actualizado con éxito!');
      setEquipoEditando(null);
      await cargarEquipos();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Error al actualizar el equipo.');
    }
  };

  // Abrir modal de dar de baja (RF-P5-03)
  const iniciarBaja = (eq) => {
    setEquipoBaja(eq);
    setMotivoBaja('');
  };

  const confirmarBaja = async (e) => {
    e.preventDefault();
    if (!motivoBaja.trim()) {
      alert('Debe indicar un motivo para dar de baja el equipo.');
      return;
    }

    try {
      const resp = await darDeBajaEquipo(equipoBaja.codigo, motivoBaja);

      // Si no registra historial previo de incidentes o revisiones, ofrece eliminarlo definitivamente
      if (resp?.sinHistorial) {
        const deseaEliminar = window.confirm(
          'El equipo quedó dado de baja y no posee historial de uso registrado. ¿Deseas eliminarlo de forma definitiva del inventario?'
        );
        if (deseaEliminar) {
          await eliminarEquipo(equipoBaja.codigo);
        }
      }

      setEquipoBaja(null);
      setMotivoBaja('');
      await cargarEquipos();
    } catch (error) {
      console.error('Error al dar de baja:', error);
      alert(error.message || 'Error al procesar la baja del equipo.');
    }
  };

  return (
    <div style={{ padding: '10px 0', width: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Botón superior para alternar formulario */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => {
            setMostrarFormulario(!mostrarFormulario);
            setMensaje('');
          }}
          style={{
            backgroundColor: mostrarFormulario ? '#dc3545' : '#0d6efd',
            color: 'white',
            padding: '9px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {mostrarFormulario ? '✕ Cerrar formulario' : '+ Registrar nuevo equipo'}
        </button>
      </div>

      {/* FORMULARIO DE REGISTRO (RF-P5-01) */}
      {mostrarFormulario && (
        <div style={{
          marginBottom: '28px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px', color: '#1e293b' }}>
            Registrar Equipo en Inventario 
          </h2>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
            El sistema generará automáticamente el código único según la categoría y asignará el estado Operativo.
          </p>

          {mensaje && (
            <p style={{
              fontWeight: '600',
              color: mensaje.includes('éxito') ? '#166534' : '#dc2626',
              marginBottom: '14px',
              fontSize: '14px'
            }}>
              {mensaje}
            </p>
          )}

          <form onSubmit={manejarEnvio} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Nombre del equipo:</label>
              <input
                type="text"
                name="nombre"
                placeholder="Ej: Sony Alpha 7 IV"
                value={formData.nombre}
                onChange={manejarCambio}
                required
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Categoría:</label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={manejarCambio}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff' }}
              >
                <option value="CAMARA">CAMARA</option>
                <option value="TRIPODE">TRIPODE</option>
                <option value="MICROFONO">MICROFONO</option>
                <option value="SWITCH_VIDEO">SWITCH_VIDEO</option>
                <option value="OTRO">OTRO</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Marca:</label>
              <input
                type="text"
                name="marca"
                placeholder="Ej: Sony"
                value={formData.marca}
                onChange={manejarCambio}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Modelo:</label>
              <input
                type="text"
                name="modelo"
                placeholder="Ej: ILCE-7M4"
                value={formData.modelo}
                onChange={manejarCambio}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Fecha de compra:</label>
              <input
                type="date"
                name="fecha_compra"
                value={formData.fecha_compra}
                onChange={manejarCambio}
                required
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Valor de compra ($):</label>
              <input
                type="number"
                name="valor_compra"
                placeholder="Ej: 1800000"
                value={formData.valor_compra}
                onChange={manejarCambio}
                required
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="submit"
                style={{
                  padding: '9px 20px',
                  backgroundColor: '#198754',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Guardar Equipo
              </button>

              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                style={{
                  padding: '9px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL / FORMULARIO FLOTANTE DE EDICIÓN (RF-P5-02) */}
      {equipoEditando && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '6px', fontSize: '18px', color: '#1e293b' }}>
              Modificar Equipo: {equipoEditando.codigo}
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Actualiza los datos del equipo y su valor de compra.
            </p>

            <form onSubmit={guardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Nombre del equipo:</label>
                <input
                  type="text"
                  name="nombre"
                  value={equipoEditando.nombre}
                  onChange={manejarCambioEdicion}
                  required
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Categoría:</label>
                  <select
                    name="categoria"
                    value={equipoEditando.categoria}
                    onChange={manejarCambioEdicion}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff' }}
                  >
                    <option value="CAMARA">CAMARA</option>
                    <option value="TRIPODE">TRIPODE</option>
                    <option value="MICROFONO">MICROFONO</option>
                    <option value="SWITCH_VIDEO">SWITCH_VIDEO</option>
                    <option value="OTRO">OTRO</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Fecha de compra:</label>
                  <input
                    type="date"
                    name="fecha_compra"
                    value={equipoEditando.fecha_compra}
                    onChange={manejarCambioEdicion}
                    required
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Marca:</label>
                  <input
                    type="text"
                    name="marca"
                    value={equipoEditando.marca || ''}
                    onChange={manejarCambioEdicion}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Modelo:</label>
                  <input
                    type="text"
                    name="modelo"
                    value={equipoEditando.modelo || ''}
                    onChange={manejarCambioEdicion}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                  Valor de compra ($):
                </label>
                <input
                  type="number"
                  name="valor_compra"
                  value={equipoEditando.valor_compra}
                  onChange={manejarCambioEdicion}
                  required
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setEquipoEditando(null)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#e2e8f0',
                    color: '#334155',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#0d6efd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DAR DE BAJA EQUIPO (RF-P5-03) */}
      {equipoBaja && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '460px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '6px', fontSize: '18px', color: '#991b1b' }}>
              Dar de baja: {equipoBaja.codigo}
            </h2>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#64748b' }}>
              El equipo quedará inhabilitado para asignarse y saldrá de su kit si estaba asignado.
            </p>

            <form onSubmit={confirmarBaja} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                  Motivo de la baja:
                </label>
                <textarea
                  rows="3"
                  value={motivoBaja}
                  onChange={(e) => setMotivoBaja(e.target.value)}
                  placeholder="Ej: Falla irreparable en lente, obsoleto..."
                  required
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEquipoBaja(null)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#e2e8f0',
                    color: '#334155',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Confirmar Baja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TABLA PRINCIPAL DE INVENTARIO */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>Inventario de Equipos</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
            Listado de equipos registrados, código correlativo y estado de asignación
          </p>
        </div>

        {cargando ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>Cargando inventario...</p>
        ) : listaEquipos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 15px', color: '#64748b' }}>
            <p style={{ margin: 0 }}>No hay equipos registrados en el inventario.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 14px' }}>Código</th>
                  <th style={{ padding: '12px 14px' }}>Equipo</th>
                  <th style={{ padding: '12px 14px' }}>Categoría</th>
                  <th style={{ padding: '12px 14px' }}>Marca / Modelo</th>
                  <th style={{ padding: '12px 14px' }}>Fecha Compra</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Valor Compra</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Kit</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {listaEquipos.map((eq) => {
                  const fecha = eq.fecha_compra
                    ? new Date(eq.fecha_compra).toLocaleDateString('es-CL')
                    : '--';
                  const esBaja = eq.estado === 'DADO_DE_BAJA';

                  return (
                    <tr key={eq.codigo} style={{ borderBottom: '1px solid #f1f5f9', opacity: esBaja ? 0.65 : 1 }}>
                      <td style={{ padding: '14px', fontWeight: '700', color: '#0f172a' }}>
                        {eq.codigo}
                      </td>
                      <td style={{ padding: '14px', fontWeight: '600', color: '#1e293b' }}>
                        {eq.nombre}
                      </td>
                      <td style={{ padding: '14px', color: '#475569' }}>
                        {eq.categoria}
                      </td>
                      <td style={{ padding: '14px', color: '#64748b' }}>
                        {eq.marca || '-'} {eq.modelo ? `(${eq.modelo})` : ''}
                      </td>
                      <td style={{ padding: '14px', color: '#475569' }}>
                        {fecha}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                        ${Number(eq.valor_compra || 0).toLocaleString('es-CL')}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <span style={{
                          backgroundColor: esBaja ? '#f1f5f9' : eq.estado === 'OPERATIVO' ? '#dcfce7' : '#fee2e2',
                          color: esBaja ? '#475569' : eq.estado === 'OPERATIVO' ? '#166534' : '#991b1b',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {eq.estado}
                        </span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center', color: eq.kit ? '#0f172a' : '#64748b' }}>
                        {eq.kit?.nombre || 'Repuesto (Sin kit)'}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => iniciarEdicion(eq)}
                            style={{
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#1e293b'
                            }}
                          >
                             Modificar
                          </button>

                          {!esBaja && (
                            <button
                              type="button"
                              onClick={() => iniciarBaja(eq)}
                              style={{
                                backgroundColor: '#fee2e2',
                                border: '1px solid #fca5a5',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#991b1b'
                              }}
                            >
                               Dar de baja
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}