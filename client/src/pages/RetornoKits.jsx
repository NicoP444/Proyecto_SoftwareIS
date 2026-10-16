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
      setSalidas(data);
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
    // Inicializar cada equipo en OPERATIVO por defecto
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
        id_jefe: 1, // ID por defecto del jefe técnico
        revisiones: listaRevisiones,
      });

      setMensaje({ tipo: 'exito', texto: res.mensaje });
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
    <div style={{ padding: '0 1rem 1rem 1rem' }}>
    <h2 style={{ margin: '0 0 0.2rem 0', color: '#111827' }}>Revisión de Kits</h2>
    <p style={{ color: '#4b5563', fontSize: '0.9rem', marginTop: '0', marginBottom: '1.5rem' }}>
      Verificación de equipos retornados a bodega tras una transmisión. 
    </p>

      {mensaje && (
        <div
          style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '6px',
            backgroundColor: mensaje.tipo === 'exito' ? '#d1fae5' : '#fee2e2',
            color: mensaje.tipo === 'exito' ? '#065f46' : '#991b1b',
          }}
        >
          {mensaje.texto}
        </div>
      )}

      {cargando ? (
        <p>Cargando kits en terreno...</p>
      ) : salidas.length === 0 ? (
        <div style={{ padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          No hay kits en terreno pendientes de retorno.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {salidas.map((salida) => (
            <div
              key={salida.id_salida}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#fff',
              }}
            >
              <div>
                <strong style={{ fontSize: '1.05rem', color: '#1f2937' }}>
                  {salida.reserva?.kit?.nombre}
                </strong>
                <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '4px' }}>
                  <strong>Evento:</strong> {salida.reserva?.evento?.nombre_evento || `#${salida.reserva?.id_evento}`}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                  <strong>Responsable:</strong> {salida.responsable?.trabajador?.nombre || 'No asignado'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  <strong>Salida:</strong> {new Date(salida.fecha_hora_salida).toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => abrirModalRevision(salida)}
                style={{
                  padding: '0.6rem 1rem',
                  backgroundColor: '#333c87',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
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
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              maxWidth: '750px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Revisión de Equipos: {salidaSeleccionada.reserva?.kit?.nombre}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
              Evalúa el estado individual de cada equipo integrante del kit antes de devolverlo a inventario.
            </p>

            <form onSubmit={handleGuardarRetorno}>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                {Object.values(revisiones).map((eq) => (
                  <div
                    key={eq.codigo}
                    style={{
                      padding: '0.8rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: eq.estado_retorno !== 'OPERATIVO' ? '#fef2f2' : '#f9fafb',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong>{eq.nombre} <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>({eq.codigo})</span></strong>
                      
                      <select
                        value={eq.estado_retorno}
                        onChange={(e) => handleEstadoChange(eq.codigo, 'estado_retorno', e.target.value)}
                        style={{
                          padding: '0.35rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #ccc',
                          fontWeight: eq.estado_retorno !== 'OPERATIVO' ? 'bold' : 'normal',
                          color: eq.estado_retorno !== 'OPERATIVO' ? '#dc2626' : '#111827',
                        }}
                      >
                        <option value="OPERATIVO">Operativo</option>
                        <option value="DANO">Dañado</option>
                        <option value="PERDIDA">Perdido</option>
                        <option value="ROBO">Robado</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Observación técnica del estado..."
                        value={eq.observacion}
                        onChange={(e) => handleEstadoChange(eq.codigo, 'observacion', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.4rem',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db',
                          fontSize: '0.85rem',
                        }}
                      />

                      {eq.estado_retorno === 'DANO' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#b91c1c' }}>Costo estimado reparación ($):</span>
                          <input
                            type="number"
                            min="0"
                            required
                            placeholder="Ej: 45000"
                            value={eq.costo_reparacion}
                            onChange={(e) => handleEstadoChange(eq.codigo, 'costo_reparacion', e.target.value)}
                            style={{
                              padding: '0.3rem',
                              borderRadius: '4px',
                              border: '1px solid #ef4444',
                              width: '160px',
                              fontSize: '0.85rem',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={enviando}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#e5e7eb',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  style={{
                    padding: '0.5rem 1.2rem',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 600,
                    cursor: 'pointer',
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