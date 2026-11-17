import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import {
  obtenerKitsPorEvento,
  registrarSalidaKit,
  obtenerEventos,
} from '../services/salidaKit.service.js';
import RetornoKits from './RetornoKits.jsx';
import Incidentes from './Incidentes.jsx';
import '../styles/SalidaKits.css';

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
    return eventosActivos.filter(
      (ev) =>
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
    let claseVariante = '';
    let label = estado;

    switch (estado) {
      case 'OPERATIVO':
      case 'DISPONIBLE':
        claseVariante = 'sal-badge-verde';
        label = estado === 'DISPONIBLE' ? 'Disponible' : 'Operativo';
        break;
      case 'EN_TERRENO':
        claseVariante = 'sal-badge-azul';
        label = 'En terreno';
        break;
      case 'INCOMPLETO':
        claseVariante = 'sal-badge-rojo';
        label = 'Incompleto';
        break;
      default:
        break;
    }

    return (
      <span className={`sal-badge ${claseVariante}`}>
        <span className="sal-badge-punto" />
        <span>{label}</span>
      </span>
    );
  };

  return (
    <div>
      {/* Cabecera superior unificada */}
      <div className="encabezado">
        <div>
          <h1>Control de Salidas y Retornos</h1>
          <p>Despacho de kits, revisión de retornos e incidentes técnicos</p>
        </div>
      </div>

      {/* Contenedor tipo Tarjeta con altura mínima pareja entre pestañas */}
      <div className="sal-panel">
        {/* Barra de pestañas */}
        <div className="sal-tabs">
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
              className={`sal-tab ${tabActiva === item.id ? 'activa' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="sal-cuerpo">
          {mensaje.texto && (
            <div
              className={`sal-mensaje ${
                mensaje.tipo === 'error' ? 'sal-mensaje-error' : 'sal-mensaje-exito'
              }`}
            >
              {mensaje.texto}
            </div>
          )}

          {/* PESTAÑA 1: SALIDA DE KITS */}
          {tabActiva === 'salida' && (
            <div>
              {/* Filtros de selección de evento */}
              <div className="sal-filtros-grid">
                <div>
                  <label className="sal-label">Filtrar Eventos</label>
                  <input
                    type="text"
                    placeholder="Buscar evento por tipo o ID..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="sal-input"
                  />
                </div>

                <div>
                  <label className="sal-label">Seleccionar Evento Activo</label>
                  <select
                    value={idEventoSeleccionado}
                    onChange={manejarCambioEvento}
                    className="sal-select"
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
                <div className="sal-cargando">Cargando información operativa...</div>
              )}

              {Boolean(idEventoSeleccionado) && !cargando && (
                <div>
                  <h3 className="sal-subtitulo">Kits Asignados al Evento</h3>

                  {reservas.length === 0 ? (
                    <div className="sal-vacio">
                      No hay kits reservados para este evento.
                    </div>
                  ) : (
                    <div className="sal-reservas-lista">
                      {reservas.map((reserva) => {
                        const yaSalio = Boolean(
                          reserva.salida || reserva.kit?.estado === 'EN_TERRENO'
                        );
                        const estaIncompleto = reserva.kit?.estado === 'INCOMPLETO';

                        return (
                          <div
                            key={reserva.id_reserva}
                            className={`sal-reserva-card ${estaIncompleto ? 'incompleto' : ''}`}
                          >
                            <div>
                              <strong className="sal-kit-nombre">
                                {reserva.kit?.nombre}
                              </strong>
                              <span className="sal-kit-meta">
                                Nivel: <strong>{reserva.kit?.nivel}</strong> • Recargo: {reserva.kit?.recargo_pct}%
                              </span>
                            </div>

                            <div className="sal-reserva-acciones">
                              {estaIncompleto ? (
                                <div className="sal-estado-fila">
                                  {renderBadge('INCOMPLETO')}
                                  <span className="sal-txt-incompleto">
                                    Requiere reposición
                                  </span>
                                </div>
                              ) : yaSalio ? (
                                reserva.kit?.estado === 'EN_TERRENO' ? (
                                  <div className="sal-estado-fila-terreno">
                                    {renderBadge('EN_TERRENO')}
                                    {reserva.salida?.responsable?.trabajador?.nombre && (
                                      <span className="sal-txt-resp">
                                        Resp: <strong>{reserva.salida.responsable.trabajador.nombre}</strong>
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="sal-estado-fila">
                                    {renderBadge('DISPONIBLE')}
                                    <span className="sal-txt-retornado">Retornado</span>
                                  </div>
                                )
                              ) : reserva.kit?.estado === 'DISPONIBLE' ? (
                                <div className="sal-despacho-fila">
                                  {renderBadge('DISPONIBLE')}
                                  <select
                                    value={responsables[reserva.id_reserva] || ''}
                                    onChange={(e) =>
                                      manejarCambioResponsable(reserva.id_reserva, e.target.value)
                                    }
                                    disabled={personal.length === 0}
                                    className="sal-select-resp"
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
                                    className="sal-btn-despachar"
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
                <div className="sal-historial-bloque">
                  <button
                    type="button"
                    onClick={() => setMostrarHistorial(!mostrarHistorial)}
                    className="sal-historial-toggle"
                  >
                    <span>{mostrarHistorial ? '▼' : '▶'}</span>
                    Historial de Eventos Despachados ({eventosFinalizados.length})
                  </button>

                  {mostrarHistorial && (
                    <div className="sal-historial-lista">
                      {eventosFinalizados.map((ev) => (
                        <div
                          key={ev.id_evento}
                          onClick={() => manejarCambioEvento(ev.id_evento)}
                          className="sal-historial-item"
                        >
                          <span className="sal-historial-titulo">
                            <strong>Evento #{ev.id_evento}</strong> — {ev.tipo || 'Transmisión'}
                          </span>
                          <span className="sal-historial-fecha">
                            {new Date(ev.fecha).toLocaleDateString()}
                          </span>
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