import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { 
  obtenerKitsPorEvento, 
  registrarSalidaKit, 
  obtenerEventos 
} from '../services/salidaKit.service.js';
import RetornoKits from './RetornoKits.jsx';
import Incidentes from './Incidentes.jsx';

export default function SalidaKits() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [idEventoSeleccionado, setIdEventoSeleccionado] = useState('');
  const [reservas, setReservas] = useState([]);
  const [personal, setPersonal] = useState([]);
  
  const [busqueda, setBusqueda] = useState('');
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  const [responsables, setResponsables] = useState({});
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cargando, setCargando] = useState(false);
  const [searchParams] = useSearchParams();
  
const [tabActiva, setTabActiva] = useState(() => {
    const tab = searchParams.get('tab');
    if (tab === 'revision') return 'retorno';
    if (tab === 'incidentes') return 'incidentes';
    return 'salida';
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'revision') setTabActiva('retorno');
    if (tab === 'incidentes') setTabActiva('incidentes');
  }, [searchParams]);

  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      setCargando(true);
      const res = await obtenerEventos();
      const todosLosEventos = res.data || res || [];

      const eventosConKits = await Promise.all(
        todosLosEventos.map(async (ev) => {
          try {
            const detalle = await obtenerKitsPorEvento(ev.id_evento);
            const dataDetalle = detalle.data || detalle;
            const reservasEv = dataDetalle.reservas || [];

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

  const eventosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return eventosActivos;
    const q = busqueda.toLowerCase();
    return eventosActivos.filter((ev) => 
      ev.id_evento?.toString().includes(q) ||
      (ev.tipo && ev.tipo.toLowerCase().includes(q))
    );
  }, [eventosActivos, busqueda]);

  const manejarCambioEvento = async (e) => {
    const id = typeof e === 'object' && e.target ? e.target.value : e;
    setIdEventoSeleccionado(id);
    setResponsables({});
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

  // Badge institucional
  const renderBadge = (estado) => {
    let bg = '#f1f5f9';
    let text = '#475569';
    let label = estado;

    switch (estado) {
      case 'OPERATIVO':
      case 'DISPONIBLE':
        bg = '#dcfce7';
        text = '#15803d';
        label = estado === 'DISPONIBLE' ? 'Disponible' : 'Operativo';
        break;
      case 'EN_TERRENO':
        bg = '#dbeafe';
        text = '#1d4ed8';
        label = 'En terreno';
        break;
      case 'INCOMPLETO':
        bg = '#fee2e2';
        text = '#dc2626';
        label = 'Incompleto';
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Cabecera superior unificada */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Control de Salidas y Retornos
          </h1>
        </div>
      </div>

      {/* Contenedor tipo Tarjeta con altura mínima pareja entre pestañas */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #eef2f6',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          minHeight: '540px',
        }}
      >
        
        {/* Barra de pestañas */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 1.5rem', backgroundColor: '#ffffff', overflow: 'hidden' }}>
          {[
            { id: 'salida', label: 'Salida de Kits' },
            { id: 'retorno', label: 'Revisión y Retorno' },
            { id: 'incidentes', label: 'Registro de Incidentes' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTabActiva(item.id);
                setMensaje({ tipo: '', texto: '' });
              }}
              style={{
                padding: '1.1rem 1.3rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: tabActiva === item.id ? '700' : '500',
                fontSize: '0.92rem',
                color: tabActiva === item.id ? '#333c87' : '#64748b',
                borderBottom: tabActiva === item.id ? '2.5px solid #333c87' : '2.5px solid transparent',
                marginBottom: '-1px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '1.5rem' }}>
          {mensaje.texto && (
            <div
              style={{
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: '500',
                backgroundColor: mensaje.tipo === 'error' ? '#fee2e2' : '#dcfce7',
                color: mensaje.tipo === 'error' ? '#991b1b' : '#15803d',
                border: mensaje.tipo === 'error' ? '1px solid #fecaca' : '1px solid #bbf7d0',
              }}
            >
              {mensaje.texto}
            </div>
          )}

          {/* PESTAÑA 1: SALIDA DE KITS */}
          {tabActiva === 'salida' && (
            <div>
              {/* Filtros de selección de evento */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Filtrar Eventos
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar evento por tipo o ID..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
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
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Seleccionar Evento Activo
                  </label>
                  <select
                    value={idEventoSeleccionado}
                    onChange={manejarCambioEvento}
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
                    <option value="">-- Selecciona un evento para despacho --</option>
                    {eventosFiltrados.map((ev) => (
                      <option key={ev.id_evento} value={ev.id_evento}>
                        {`Evento #${ev.id_evento} - ${ev.tipo || 'Transmisión'} (${new Date(ev.fecha).toLocaleDateString()})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {cargando && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '0.92rem' }}>
                  Cargando información operativa...
                </div>
              )}

              {Boolean(idEventoSeleccionado) && !cargando && (
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.85rem 0' }}>
                    Kits Asignados al Evento
                  </h3>

                  {reservas.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '10px', color: '#94a3b8', fontSize: '0.88rem' }}>
                      No hay kits reservados para este evento.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        maxHeight: '340px',
                        overflowY: 'auto',
                        paddingRight: '6px',
                      }}
                    >
                      {reservas.map((reserva) => {
                        const yaSalio = Boolean(reserva.salida || reserva.kit?.estado === 'EN_TERRENO');
                        const estaIncompleto = reserva.kit?.estado === 'INCOMPLETO';

                        return (
                          <div
                            key={reserva.id_reserva}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '1.1rem 1.25rem',
                              border: '1px solid #e2e8f0',
                              borderRadius: '10px',
                              backgroundColor: estaIncompleto ? '#fff1f2' : '#ffffff',
                              transition: 'all 0.15s ease',
                              flexShrink: 0,
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: '0.98rem', color: '#0f172a', display: 'block' }}>
                                {reserva.kit?.nombre}
                              </strong>
                              <span style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                                Nivel: <strong>{reserva.kit?.nivel}</strong> • Recargo: {reserva.kit?.recargo_pct}%
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              {estaIncompleto ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {renderBadge('INCOMPLETO')}
                                  <span style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: '600' }}>
                                    Requiere reposición
                                  </span>
                                </div>
                              ) : yaSalio ? (
                                reserva.kit?.estado === 'EN_TERRENO' ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {renderBadge('EN_TERRENO')}
                                    {reserva.salida?.responsable?.trabajador?.nombre && (
                                      <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                                        Resp: <strong>{reserva.salida.responsable.trabajador.nombre}</strong>
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {renderBadge('DISPONIBLE')}
                                    <span style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: '600' }}>
                                      Retornado
                                    </span>
                                  </div>
                                )
                              ) : reserva.kit?.estado === 'DISPONIBLE' ? (
                                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                                  {renderBadge('DISPONIBLE')}
                                  <select
                                    value={responsables[reserva.id_reserva] || ''}
                                    onChange={(e) => manejarCambioResponsable(reserva.id_reserva, e.target.value)}
                                    disabled={personal.length === 0}
                                    style={{
                                      padding: '0.5rem 0.75rem',
                                      borderRadius: '6px',
                                      border: '1px solid #cbd5e1',
                                      fontSize: '0.85rem',
                                      backgroundColor: '#f8fafc',
                                      color: '#0f172a',
                                      outline: 'none',
                                    }}
                                  >
                                    <option value="">
                                      {personal.length === 0
                                        ? '-- Sin personal asignado al evento --'
                                        : '-- Asignar Responsable --'}
                                    </option>
                                    {personal.map((asig) => (
                                      <option key={asig.id_asignacion} value={asig.id_asignacion}>
                                        {asig.trabajador?.nombre} ({asig.rol?.nombre_rol || 'Personal'})
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleRegistrarSalida(reserva.id_reserva)}
                                    style={{
                                      backgroundColor: '#333c87',
                                      color: '#ffffff',
                                      border: 'none',
                                      padding: '0.5rem 1rem',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontSize: '0.85rem',
                                      fontWeight: '600',
                                      transition: 'background-color 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#272e6b')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#333c87')}
                                  >
                                    Despachar Kit
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
                <div style={{ marginTop: '2.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setMostrarHistorial(!mostrarHistorial)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontWeight: '700',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: 0,
                    }}
                  >
                    <span>{mostrarHistorial ? '▼' : '▶'}</span>
                    Historial de Eventos Despachados ({eventosFinalizados.length})
                  </button>

                  {mostrarHistorial && (
                    <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
                      {eventosFinalizados.map((ev) => (
                        <div 
                          key={ev.id_evento}
                          onClick={() => manejarCambioEvento(ev.id_evento)}
                          style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ color: '#0f172a' }}><strong>Evento #{ev.id_evento}</strong> — {ev.tipo || 'Transmisión'}</span>
                          <span style={{ color: '#64748b' }}>{new Date(ev.fecha).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA 2: REVISIÓN DE KITS */}
          {tabActiva === 'retorno' && <RetornoKits />}

          {/* PESTAÑA 3: INCIDENTES */}
          {tabActiva === 'incidentes' && <Incidentes />}
        </div>
      </div>
    </div>
  );
}