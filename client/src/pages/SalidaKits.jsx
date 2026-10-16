import React, { useState, useEffect, useMemo } from 'react';
import { 
  obtenerKitsPorEvento, 
  registrarSalidaKit, 
  obtenerEventos 
} from '../services/salidaKit.service.js';
import RetornoKits from './RetornoKits.jsx';
import Incidentes from './Incidentes.jsx';

export default function SalidaKits() {
  const [eventos, setEventos] = useState([]);
  const [idEventoSeleccionado, setIdEventoSeleccionado] = useState('');
  const [reservas, setReservas] = useState([]);
  const [personal, setPersonal] = useState([]);
  
  // Búsqueda y visualización de historial
  const [busqueda, setBusqueda] = useState('');
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  // Guardar el trabajador responsable asignado a cada reserva: { [id_reserva]: id_asignacion }
  const [responsables, setResponsables] = useState({});
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cargando, setCargando] = useState(false);
  const [tabActiva, setTabActiva] = useState('salida');

  // 1. Cargar lista de eventos y comprobar el estado de sus kits
  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      setCargando(true);
      const res = await obtenerEventos();
      const todosLosEventos = res.data || res || [];

      // Consultamos los kits de cada evento
      const eventosConKits = await Promise.all(
        todosLosEventos.map(async (ev) => {
          try {
            const detalle = await obtenerKitsPorEvento(ev.id_evento);
            const dataDetalle = detalle.data || detalle;
            const reservasEv = dataDetalle.reservas || [];

            // Un evento está ACTIVO para despacho solo si tiene kits en terreno
            // o kits DISPONIBLES que aún no han sido despachados
            const estaActivo = reservasEv.some((r) => {
              const estaEnTerreno = r.kit?.estado === 'EN_TERRENO';
              const pendienteSalida = !r.salida && r.kit?.estado === 'DISPONIBLE';
              return estaEnTerreno || pendienteSalida;
            });

            return {
              ...ev,
              reservas: reservasEv,
              estaActivo,
            };
          } catch {
            return { ...ev, reservas: [], estaActivo: false };
          }
        })
      );

      setEventos(eventosConKits);
    } catch (error) {
      console.error('Error cargando eventos:', error);
    } finally {
      setCargando(false);
    }
  };

  // 2. Separar eventos activos vs historial
  const { eventosActivos, eventosFinalizados } = useMemo(() => {
    const activos = [];
    const finalizados = [];

    eventos.forEach((ev) => {
      if (ev.estaActivo) {
        activos.push(ev);
      } else {
        finalizados.push(ev);
      }
    });

    return { eventosActivos: activos, eventosFinalizados: finalizados };
  }, [eventos]);

  // Eventos activos filtrados por el buscador
  const eventosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return eventosActivos;
    const q = busqueda.toLowerCase();
    return eventosActivos.filter((ev) => 
      ev.id_evento?.toString().includes(q) ||
      (ev.tipo && ev.tipo.toLowerCase().includes(q)) ||
      (ev.nombre && ev.nombre.toLowerCase().includes(q))
    );
  }, [eventosActivos, busqueda]);

  // 3. Al seleccionar un evento, cargar sus kits reservados y personal
  const manejarCambioEvento = async (e) => {
    const id = typeof e === 'object' && e.target ? e.target.value : e;
    setIdEventoSeleccionado(id);
    setMensaje({ tipo: '', texto: '' });
    if (!id) {
      setReservas([]);
      setPersonal([]);
      return;
    }

    try {
      setCargando(true);
      const res = await obtenerKitsPorEvento(id);
      const data = res.data || res;
      setReservas(data.reservas || []);
      setPersonal(data.personalAsignado || []);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'Error al cargar kits del evento' });
    } finally {
      setCargando(false);
    }
  };

  const manejarCambioResponsable = (idReserva, idAsignacion) => {
    setResponsables((prev) => ({
      ...prev,
      [idReserva]: idAsignacion,
    }));
  };

  // 4. Registrar la salida del kit
  const handleRegistrarSalida = async (idReserva) => {
    const idAsignacion = responsables[idReserva];
    if (!idAsignacion) {
      setMensaje({ tipo: 'error', texto: 'Debes seleccionar un trabajador responsable para el kit' });
      return;
    }

    try {
      setMensaje({ tipo: '', texto: '' });
      await registrarSalidaKit({
        id_reserva: idReserva,
        id_asignacion: idAsignacion,
        fecha_hora_salida: new Date().toISOString(),
      });

      setMensaje({ tipo: 'exito', texto: 'Salida de kit registrada con éxito' });
      
      await cargarEventos();
      manejarCambioEvento(idEventoSeleccionado);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'Error al registrar salida' });
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      {/* Botones de las 3 pestañas */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb' }}>
        <button
          type="button"
          onClick={() => { setTabActiva('salida'); setMensaje({ tipo: '', texto: '' }); }}
          style={{
            padding: '0.6rem 1.2rem',
            border: 'none',
            borderBottom: tabActiva === 'salida' ? '3px solid #2563eb' : 'none',
            backgroundColor: 'transparent',
            fontWeight: tabActiva === 'salida' ? 'bold' : 'normal',
            color: tabActiva === 'salida' ? '#2563eb' : '#6b7280',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Salida de Kits
        </button>
        <button
          type="button"
          onClick={() => { setTabActiva('retorno'); setMensaje({ tipo: '', texto: '' }); }}
          style={{
            padding: '0.6rem 1.2rem',
            border: 'none',
            borderBottom: tabActiva === 'retorno' ? '3px solid #2563eb' : 'none',
            backgroundColor: 'transparent',
            fontWeight: tabActiva === 'retorno' ? 'bold' : 'normal',
            color: tabActiva === 'retorno' ? '#2563eb' : '#6b7280',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Revisión
        </button>
        <button
          type="button"
          onClick={() => { setTabActiva('incidentes'); setMensaje({ tipo: '', texto: '' }); }}
          style={{
            padding: '0.6rem 1.2rem',
            border: 'none',
            borderBottom: tabActiva === 'incidentes' ? '3px solid #2563eb' : 'none',
            backgroundColor: 'transparent',
            fontWeight: tabActiva === 'incidentes' ? 'bold' : 'normal',
            color: tabActiva === 'incidentes' ? '#2563eb' : '#6b7280',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Incidentes
        </button>
      </div>

      {mensaje.texto && (
        <div style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          borderRadius: '4px',
          backgroundColor: mensaje.tipo === 'error' ? '#ffebee' : '#e8f5e9',
          color: mensaje.tipo === 'error' ? '#c62828' : '#2e7d32',
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* PESTAÑA 1: SALIDA DE KITS */}
      {tabActiva === 'salida' && (
        <>
          <h2 style={{ marginBottom: '0.2rem' }}>Registrar Salida de Kits de Bodega</h2>
          <p style={{ color: '#4b5563', fontSize: '0.9rem', marginTop: '0', marginBottom: '1.5rem' }}>
            Entrega de kits antes de la transmisión
          </p>

          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold' }}>
              Seleccionar Evento Activo:
            </label>

            <input
              type="text"
              placeholder="Buscar evento por nombre o ID..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
            />

            <select
              value={idEventoSeleccionado}
              onChange={manejarCambioEvento}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">-- Selecciona un evento --</option>
              {eventosFiltrados.map((ev) => (
                <option key={ev.id_evento} value={ev.id_evento}>
                  {`Evento #${ev.id_evento} - ${ev.tipo || ev.nombre || 'Transmisión'} (${new Date(ev.fecha).toLocaleDateString()})`}
                </option>
              ))}
            </select>
          </div>

          {cargando && <p>Cargando información del evento...</p>}

          {Boolean(idEventoSeleccionado) && !cargando && (
            <div>
              <h3>Kits Asignados al Evento</h3>
              {reservas.length === 0 ? (
                <p>No hay kits reservados para este evento.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {reservas.map((reserva) => {
                    const yaSalio = Boolean(reserva.salida || reserva.kit?.estado === 'EN_TERRENO');
                    const estaIncompleto = reserva.kit?.estado === 'INCOMPLETO';

                    return (
                      <div
                        key={reserva.id_reserva}
                        style={{
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          padding: '1rem',
                          backgroundColor: estaIncompleto ? '#fff1f2' : (yaSalio ? '#f9f9f9' : '#fff'),
                          borderColor: estaIncompleto ? '#fecdd3' : '#ddd',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>{reserva.kit?.nombre}</strong> (Nivel: {reserva.kit?.nivel})
                            
                            {(!yaSalio || reserva.kit?.estado === 'EN_TERRENO' || estaIncompleto) && (
                              <div style={{ fontSize: '0.9rem', color: '#555', marginTop: '4px' }}>
                                Estado:{' '}
                                <span style={{
                                  fontWeight: 'bold',
                                  color: estaIncompleto ? '#e11d48' : (yaSalio ? '#d97706' : '#16a34a')
                                }}>
                                  {reserva.kit?.estado ? reserva.kit.estado.replace(/_/g, ' ') : ''}
                                </span>
                              </div>
                            )}
                          </div>

                          {estaIncompleto ? (
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.85rem', color: '#e11d48', fontWeight: 600 }}>
                                Kit Incompleto
                              </span>
                            </div>
                          ) : yaSalio ? (
                            reserva.kit?.estado === 'EN_TERRENO' ? (
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic', display: 'block' }}>
                                  En terreno
                                </span>
                                {reserva.salida?.responsable?.trabajador?.nombre && (
                                  <span style={{ fontSize: '0.85rem', color: '#1f2937', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                                    Responsable: {reserva.salida.responsable.trabajador.nombre}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600, display: 'block' }}>
                                  ✓ Retornado a Bodega
                                </span>
                              </div>
                            )
                          ) : reserva.kit?.estado === 'DISPONIBLE' ? (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <select
                                value={responsables[reserva.id_reserva] || ''}
                                onChange={(e) => manejarCambioResponsable(reserva.id_reserva, e.target.value)}
                                style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
                              >
                                <option value="">-- Seleccionar Responsable --</option>
                                {personal.map((asig) => (
                                  <option key={asig.id_asignacion} value={asig.id_asignacion}>
                                    {asig.trabajador.nombre} ({asig.rol?.nombre_rol || 'Personal'})
                                  </option>
                                ))}
                              </select>

                              <button
                                onClick={() => handleRegistrarSalida(reserva.id_reserva)}
                                style={{
                                  backgroundColor: '#2563eb',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.5rem 1rem',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                              >
                                Registrar Salida
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Historial de Eventos Concluidos */}
          {eventosFinalizados.length > 0 && (
            <div style={{ marginTop: '3rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setMostrarHistorial(!mostrarHistorial)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4b5563',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: 0
                }}
              >
                <span>{mostrarHistorial ? '▼' : '▶'}</span>
                Historial de Eventos Concluidos ({eventosFinalizados.length})
              </button>

              {mostrarHistorial && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {eventosFinalizados.map((ev) => (
                    <div 
                      key={ev.id_evento}
                      onClick={() => manejarCambioEvento(ev.id_evento)}
                      style={{
                        padding: '0.6rem 1rem',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span><strong>Evento #{ev.id_evento}</strong> - {ev.tipo || ev.nombre || 'Transmisión'}</span>
                      <span style={{ color: '#6b7280' }}>{new Date(ev.fecha).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* PESTAÑA 2: REVISIÓN DE KITS */}
      {tabActiva === 'retorno' && <RetornoKits />}

      {/* PESTAÑA 3: INCIDENTES */}
      {tabActiva === 'incidentes' && <Incidentes />}
    </div>
  );
}