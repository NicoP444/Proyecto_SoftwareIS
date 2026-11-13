import React, { useState, useEffect } from 'react';
import { obtenerKitsEnTerreno, registrarRetornoKit } from '../services/retornoKit.service.js';

export default function RetornoKits() {
  const [salidas, setSalidas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [salidaSeleccionada, setSalidaSeleccionada] = useState(null);
  const [revisiones, setRevisiones] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargarSalidasEnTerreno = async () => {
    try {
      setCargando(true);
      const data = await obtenerKitsEnTerreno();
      setSalidas(data || []);
    } catch (error) {
      console.error('Error al cargar kits en terreno:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSalidasEnTerreno();
  }, []);

  const abrirModalRevision = (salida) => {
    setSalidaSeleccionada(salida);
    const estadoInicial = {};
    const equipos = salida.reserva?.kit?.equipos || [];
    equipos.forEach((eq) => {
      estadoInicial[eq.codigo] = {
        codigo: eq.codigo,
        nombre: eq.nombre,
        estado_retorno: 'OPERATIVO',
        observacion: '',
        costo_reparacion: '',
      };
    });
    setRevisiones(estadoInicial);
  };

  const cerrarModal = () => {
    setSalidaSeleccionada(null);
    setRevisiones({});
  };

  const handleEstadoChange = (codigo, campo, valor) => {
    setRevisiones((prev) => ({
      ...prev,
      [codigo]: {
        ...prev[codigo],
        [campo]: valor,
      },
    }));
  };

  const handleGuardarRetorno = async (e) => {
    e.preventDefault();
    try {
      setEnviando(true);
      const listaRevisiones = Object.values(revisiones).map((r) => ({
        codigo: r.codigo,
        estado_retorno: r.estado_retorno,
        observacion: r.observacion,
        costo_reparacion: r.costo_reparacion ? Number(r.costo_reparacion) : null,
      }));

      const res = await registrarRetornoKit({
        id_salida: salidaSeleccionada.id_salida,
        id_jefe: 1,
        revisiones: listaRevisiones,
      });

      setMensaje({ tipo: 'exito', texto: res.mensaje || 'Retorno y revisión guardados exitosamente.' });
      cerrarModal();
      await cargarSalidasEnTerreno();
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.mensaje || error.message || 'Error al guardar retorno',
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>
          Kits en Terreno Pendientes de Recepción
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

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '0.92rem' }}>
          Cargando kits en terreno...
        </div>
      ) : salidas.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '10px', color: '#94a3b8', fontSize: '0.9rem', border: '1px solid #e2e8f0' }}>
          No hay kits en terreno pendientes de retorno en este momento.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            maxHeight: '380px',
            overflowY: 'auto',
            paddingRight: '6px',
          }}
        >
          {salidas.map((salida) => (
            <div
              key={salida.id_salida}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.1rem 1.25rem',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                flexShrink: 0,
              }}
            >
              <div>
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                  {salida.reserva?.kit?.nombre}
                </strong>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
                  <strong>Evento:</strong> {salida.reserva?.evento?.tipo || `#${salida.reserva?.id_evento}`}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  <strong>Responsable:</strong> {salida.responsable?.trabajador?.nombre || 'No asignado'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '2px' }}>
                  Salida: {new Date(salida.fecha_hora_salida).toLocaleString('es-CL')}
                </div>
              </div>

              <button
                type="button"
                onClick={() => abrirModalRevision(salida)}
                style={{
                  padding: '0.55rem 1.1rem',
                  backgroundColor: '#333c87',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#272e6b')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#333c87')}
              >
                Revisar Retorno
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE REVISIÓN INDIVIDUAL */}
      {salidaSeleccionada && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              maxWidth: '750px',
              width: '100%',
              maxHeight: '88vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                  Revisión Técnica: {salidaSeleccionada.reserva?.kit?.nombre}
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Inspección de estado operativo individual para el reintegro a bodega.
                </span>
              </div>
            </div>

            <form onSubmit={handleGuardarRetorno}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                {Object.values(revisiones).map((eq) => {
                  const noOperativo = eq.estado_retorno !== 'OPERATIVO';
                  return (
                    <div
                      key={eq.codigo}
                      style={{
                        padding: '1rem',
                        border: noOperativo ? '1px solid #fecaca' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        backgroundColor: noOperativo ? '#fef2f2' : '#f8fafc',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{eq.nombre}</strong>
                          <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '6px' }}>({eq.codigo})</span>
                        </div>
                        
                        <select
                          value={eq.estado_retorno}
                          onChange={(e) => handleEstadoChange(eq.codigo, 'estado_retorno', e.target.value)}
                          style={{
                            padding: '0.4rem 0.65rem',
                            borderRadius: '6px',
                            border: noOperativo ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                            fontWeight: '700',
                            fontSize: '0.82rem',
                            color: noOperativo ? '#dc2626' : '#15803d',
                            backgroundColor: '#ffffff',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="OPERATIVO">Operativo</option>
                          <option value="DANO">Dañado</option>
                          <option value="PERDIDA">Perdido</option>
                          <option value="ROBO">Robado</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input
                          type="text"
                          maxLength={255}
                          placeholder="Observación técnica del estado o entrega..."
                          value={eq.observacion}
                          onChange={(e) => handleEstadoChange(eq.codigo, 'observacion', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.85rem',
                            backgroundColor: '#ffffff',
                            color: '#0f172a',
                            boxSizing: 'border-box',
                            outline: 'none',
                          }}
                        />

                        {eq.estado_retorno === 'DANO' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#b91c1c' }}>
                              Costo estimado reparación ($):
                            </span>
                            <input
                              type="number"
                              min="0"
                              required
                              placeholder="Ej: 45000"
                              value={eq.costo_reparacion}
                              onChange={(e) => handleEstadoChange(eq.codigo, 'costo_reparacion', e.target.value)}
                              style={{
                                padding: '0.45rem 0.65rem',
                                borderRadius: '6px',
                                border: '1.5px solid #ef4444',
                                width: '150px',
                                fontSize: '0.85rem',
                                outline: 'none',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={enviando}
                  style={{
                    padding: '0.55rem 1.1rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    color: '#475569',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  style={{
                    padding: '0.55rem 1.25rem',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {enviando ? 'Guardando...' : 'Confirmar Retorno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}