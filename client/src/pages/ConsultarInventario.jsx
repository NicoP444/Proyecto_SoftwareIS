import React, { useState, useEffect, useMemo } from 'react';
import { consultarInventario } from '../services/consultarInventario.service.js';
import { getHistorialEquipo } from '../services/historialEquipo.service.js';
import '../styles/ConsultarInventario.css';

export default function ConsultarInventario() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [tab, setTab] = useState('kits');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [kitSeleccionado, setKitSeleccionado] = useState(null);

  // Estados para el Modal de Historial de Equipo
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState('');
  const [datosHistorial, setDatosHistorial] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const res = await consultarInventario();
      const payload = res?.data || res || {};
      setDatos(payload);
      if (payload.kits?.length > 0) {
        setKitSeleccionado(payload.kits[0]);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar el inventario.');
    } finally {
      setCargando(false);
    }
  };

  const abrirModalHistorial = async (codigo) => {
    setModalHistorialAbierto(true);
    setCargandoHistorial(true);
    setErrorHistorial('');
    setDatosHistorial(null);

    try {
      const res = await getHistorialEquipo(codigo);
      setDatosHistorial(res?.data || res);
    } catch (err) {
      setErrorHistorial(err.message || 'No se pudo cargar el historial del equipo.');
    } finally {
      setCargandoHistorial(false);
    }
  };

  const cerrarModalHistorial = () => {
    setModalHistorialAbierto(false);
    setDatosHistorial(null);
    setErrorHistorial('');
  };

  // Formateo de enums a texto profesional con tildes, Ñ y 'Retirado'
  const formatearEstadoTexto = (estado) => {
    switch (estado) {
      case 'OPERATIVO':
        return 'Operativo';
      case 'DISPONIBLE':
        return 'Disponible';
      case 'EN_TERRENO':
        return 'En terreno';
      case 'INCOMPLETO':
        return 'Incompleto';
      case 'DANADO':
      case 'DANO':
        return 'Dañado';
      case 'DADO_DE_BAJA':
        return 'Retirado';
      case 'PERDIDO':
        return 'Perdido';
      case 'ROBADO':
        return 'Robado';
      case 'MANTENCION':
        return 'Mantención';
      default:
        return estado;
    }
  };

  // Badge pill con ancho uniforme
  const renderBadge = (estado) => {
    let claseVariante = '';

    switch (estado) {
      case 'OPERATIVO':
      case 'DISPONIBLE':
        claseVariante = 'inv-badge-verde';
        break;
      case 'EN_TERRENO':
        claseVariante = 'inv-badge-azul';
        break;
      case 'INCOMPLETO':
      case 'DANADO':
      case 'DADO_DE_BAJA':
      case 'PERDIDO':
      case 'ROBADO':
        claseVariante = 'inv-badge-rojo';
        break;
      default:
        break;
    }

    return (
      <span className={`inv-badge ${claseVariante}`}>
        <span className="inv-badge-punto" />
        <span>{formatearEstadoTexto(estado)}</span>
      </span>
    );
  };

  const renderBadgeEventoHistorial = (tipo) => {
    let claseVariante = '';
    let label = tipo;

    switch (tipo) {
      case 'COMPRA':
        claseVariante = 'inv-badge-hist-compra';
        label = 'Ingreso';
        break;
      case 'SALIDA':
        claseVariante = 'inv-badge-hist-salida';
        label = 'Salida';
        break;
      case 'RETORNO':
        claseVariante = 'inv-badge-hist-retorno';
        label = 'Retorno';
        break;
      case 'INCIDENTE':
        claseVariante = 'inv-badge-hist-incidente';
        label = 'Incidente';
        break;
      case 'BAJA':
        claseVariante = 'inv-badge-hist-baja';
        label = 'Retirado';
        break;
      default:
        break;
    }

    return <span className={`inv-badge-hist ${claseVariante}`}>{label}</span>;
  };

  const formatearDescripcionHistorial = (item) => {
    if (item.tipo === 'INCIDENTE') {
      return item.descripcion
        .replace('DANO', 'Daño')
        .replace('PERDIDA', 'Pérdida')
        .replace('ROBO', 'Robo');
    }

    if (item.tipo === 'BAJA') {
      return item.descripcion.replace('Equipo dado de baja:', 'Equipo retirado:');
    }

    return item.descripcion;
  };

  // Filtros combinados: Búsqueda por texto + Filtro por Estado
  const kitsFiltrados = useMemo(() => {
    if (!datos?.kits) return [];
    let filtrados = datos.kits;

    if (filtroEstado !== 'TODOS') {
      filtrados = filtrados.filter((k) => k.estado === filtroEstado);
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      filtrados = filtrados.filter(
        (k) =>
          k.nombre?.toLowerCase().includes(q) ||
          k.nivel?.toLowerCase().includes(q) ||
          k.equipos?.some(
            (eq) =>
              eq.codigo?.toLowerCase().includes(q) ||
              eq.nombre?.toLowerCase().includes(q)
          )
      );
    }
    return filtrados;
  }, [datos, busqueda, filtroEstado]);

  useEffect(() => {
    if (kitsFiltrados.length === 0) {
      setKitSeleccionado(null);
    } else if (!kitsFiltrados.some((k) => k.id_kit === kitSeleccionado?.id_kit)) {
      setKitSeleccionado(kitsFiltrados[0]);
    }
  }, [kitsFiltrados, kitSeleccionado]);

  const repuestosFiltrados = useMemo(() => {
    if (!datos?.repuestos) return [];
    let filtrados = datos.repuestos;

    if (filtroEstado !== 'TODOS') {
      filtrados = filtrados.filter((r) => r.estado === filtroEstado);
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      filtrados = filtrados.filter(
        (r) =>
          r.codigo?.toLowerCase().includes(q) ||
          r.nombre?.toLowerCase().includes(q) ||
          r.categoria?.toLowerCase().includes(q)
      );
    }
    return filtrados;
  }, [datos, busqueda, filtroEstado]);

  const todosEquiposFiltrados = useMemo(() => {
    if (!datos?.todosLosEquipos) return [];
    let filtrados = datos.todosLosEquipos;

    if (filtroEstado !== 'TODOS') {
      filtrados = filtrados.filter((eq) => eq.estado === filtroEstado);
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      filtrados = filtrados.filter(
        (eq) =>
          eq.codigo?.toLowerCase().includes(q) ||
          eq.nombre?.toLowerCase().includes(q) ||
          eq.categoria?.toLowerCase().includes(q) ||
          eq.marca?.toLowerCase().includes(q) ||
          eq.modelo?.toLowerCase().includes(q)
      );
    }
    return filtrados;
  }, [datos, busqueda, filtroEstado]);

  return (
    <div>
      {/* Cabecera superior */}
      <div className="encabezado">
        <div>
          <h1>Inventario General</h1>
          <p>Disponibilidad de kits, repuestos en bodega y balance de equipos</p>
        </div>
      </div>

      {/* Indicadores métricos KPI */}
      <div className="inv-kpis">
        <div className="inv-kpi-card">
          <span className="inv-kpi-titulo">Total Kits Registrados</span>
          <div className="inv-kpi-valor">{datos?.kits?.length || 0}</div>
        </div>

        <div className="inv-kpi-card inv-kpi-verde">
          <span className="inv-kpi-titulo">Repuestos Disponibles</span>
          <div className="inv-kpi-valor">{datos?.repuestos?.length || 0}</div>
        </div>

        <div className="inv-kpi-card inv-kpi-azul">
          <span className="inv-kpi-titulo">Total de Equipos</span>
          <div className="inv-kpi-valor">{datos?.resumen?.totalEquipos || 0}</div>
        </div>
      </div>

      {/* Contenedor tipo Tarjeta */}
      <div className="inv-panel">
        {/* Pestañas de navegación */}
        <div className="inv-tabs">
          {[
            { id: 'kits', label: 'Kits y Asignaciones' },
            { id: 'repuestos', label: 'Stock de Repuestos' },
            { id: 'equipos', label: 'Catálogo de Equipos' },
            { id: 'resumen', label: 'Resumen de Inventario' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setBusqueda('');
                setFiltroEstado('TODOS');
              }}
              className={`inv-tab ${tab === item.id ? 'activa' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="inv-cuerpo">
          {error && <div className="inv-error">{error}</div>}

          {cargando ? (
            <div className="inv-cargando">Cargando información del inventario...</div>
          ) : (
            <>
              {/* FILTROS: BUSCADOR + DESPLEGABLE DE ESTADO */}
              {tab !== 'resumen' && (
                <div className="inv-filtros">
                  {/* Buscador de texto */}
                  <div className="inv-buscador-wrap">
                    <svg
                      className="inv-buscador-icono"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      maxLength={60}
                      placeholder="Buscar por código correlativo o nombre..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value.slice(0, 60))}
                      className="inv-buscador-input"
                    />
                  </div>

                  {/* Filtro por estado desplegable */}
                  <div className="inv-filtro-select-wrap">
                    <select
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                      className="inv-filtro-select"
                    >
                      <option value="TODOS">Todos los estados</option>
                      {tab === 'kits' ? (
                        <>
                          <option value="DISPONIBLE">Disponible</option>
                          <option value="EN_TERRENO">En terreno</option>
                          <option value="INCOMPLETO">Incompleto</option>
                        </>
                      ) : (
                        <>
                          <option value="OPERATIVO">Operativo</option>
                          <option value="DANADO">Dañado</option>
                          <option value="DADO_DE_BAJA">Retirado</option>
                          <option value="PERDIDO">Perdido</option>
                          <option value="ROBADO">Robado</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              )}

              {/* SECCIÓN 1: KITS Y DETALLES */}
              {tab === 'kits' && (
                <div className="inv-kits-grid">
                  {/* Lista de Kits a la izquierda */}
                  <div className="inv-kits-col">
                    <div className="inv-kits-subtitulo">
                      Kits Registrados ({kitsFiltrados.length})
                    </div>

                    <div className="inv-kits-lista">
                      {kitsFiltrados.length === 0 ? (
                        <div className="inv-vacio-caja">
                          No se encontraron kits coincidentes.
                        </div>
                      ) : (
                        kitsFiltrados.map((k) => {
                          const seleccionado = kitSeleccionado?.id_kit === k.id_kit;
                          return (
                            <div
                              key={k.id_kit}
                              onClick={() => setKitSeleccionado(k)}
                              className={`inv-kit-item ${seleccionado ? 'seleccionado' : ''}`}
                            >
                              <div className="inv-kit-item-cab">
                                <strong>{k.nombre}</strong>
                              </div>
                              <div className="inv-kit-item-pie">
                                <span className="inv-kit-meta">
                                  Nivel: <strong>{k.nivel}</strong> • {k.equipos?.length || 0} eq.
                                </span>
                                {renderBadge(k.estado)}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Panel de Detalle del Kit seleccionado */}
                  <div className="inv-kit-detalle">
                    {kitSeleccionado ? (
                      <>
                        <div className="inv-kit-detalle-cab">
                          <div>
                            <h2>{kitSeleccionado.nombre}</h2>
                            <span className="inv-kit-detalle-sub">
                              Nivel: <strong>{kitSeleccionado.nivel}</strong> | Recargo referencial: {kitSeleccionado.recargo_pct}%
                            </span>
                          </div>
                          {renderBadge(kitSeleccionado.estado)}
                        </div>

                        {/* Próximos Eventos Asignados */}
                        <div className="inv-bloque-eventos">
                          <h4 className="inv-seccion-titulo">Próximos Eventos Asignados</h4>
                          {kitSeleccionado.proximosEventos?.length === 0 ? (
                            <div className="inv-sin-eventos">
                              Sin eventos futuros programados para este kit.
                            </div>
                          ) : (
                            <div className="inv-eventos-lista">
                              {kitSeleccionado.proximosEventos.map((ev) => (
                                <div key={ev.id_evento} className="inv-evento-item">
                                  <div>
                                    <strong>#{ev.id_evento} {ev.tipo}</strong> — {ev.direccion}
                                  </div>
                                  <span className="inv-evento-fecha">
                                    {new Date(ev.fecha).toLocaleDateString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Equipos integrantes */}
                        <div>
                          <h4 className="inv-seccion-titulo">Equipos Integrantes</h4>
                          <div className="inv-tabla-scroll-kit">
                            <table className="inv-tabla">
                              <thead>
                                <tr>
                                  <th>CÓDIGO</th>
                                  <th>EQUIPO / MODELO</th>
                                  <th>CATEGORÍA</th>
                                  <th>ESTADO</th>
                                </tr>
                              </thead>
                              <tbody>
                                {kitSeleccionado.equipos?.map((eq) => {
                                  const marcaModelo = [eq.marca, eq.modelo].filter(Boolean).join(' ');
                                  const debeMostrarDetalle = Boolean(
                                    marcaModelo && !eq.nombre.toLowerCase().includes(marcaModelo.toLowerCase())
                                  );

                                  return (
                                    <tr key={eq.codigo}>
                                      <td className="inv-td-codigo">{eq.codigo}</td>
                                      <td className="inv-td-nombre">
                                        {eq.nombre}
                                        {debeMostrarDetalle && (
                                          <span className="inv-marca-modelo">({marcaModelo})</span>
                                        )}
                                      </td>
                                      <td className="inv-td-suave">{eq.categoria}</td>
                                      <td className="inv-td-der">{renderBadge(eq.estado)}</td>
                                      <td className="inv-td-der"></td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="inv-kit-sin-seleccion">
                        Selecciona un kit de la lista izquierda.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* SECCIÓN 2: REPUESTOS OPERATIVOS */}
              {tab === 'repuestos' && (
                <div>
                  <div className="inv-tabla-cab">
                    <h3>Stock de Repuestos</h3>
                  </div>

                  <div className="inv-tabla-scroll">
                    <table className="inv-tabla">
                      <thead>
                        <tr>
                          <th>CÓDIGO</th>
                          <th>EQUIPO</th>
                          <th>CATEGORÍA</th>
                          <th>VALOR COMPRA</th>
                          <th className="inv-th-der">ESTADO</th>
                          <th className="inv-th-der">HISTORIAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repuestosFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="inv-tabla-vacio">
                              No hay repuestos que coincidan con la búsqueda.
                            </td>
                          </tr>
                        ) : (
                          repuestosFiltrados.map((rep) => {
                            const marcaModelo = [rep.marca, rep.modelo].filter(Boolean).join(' ');
                            const debeMostrarDetalle = Boolean(
                              marcaModelo && !rep.nombre.toLowerCase().includes(marcaModelo.toLowerCase())
                            );

                            return (
                              <tr key={rep.codigo}>
                                <td className="inv-td-codigo">{rep.codigo}</td>
                                <td className="inv-td-nombre">
                                  {rep.nombre}
                                  {debeMostrarDetalle && (
                                    <span className="inv-marca-modelo">({marcaModelo})</span>
                                  )}
                                </td>
                                <td className="inv-td-suave">{rep.categoria}</td>
                                <td className="inv-td-monto">
                                  ${Number(rep.valor_compra || 0).toLocaleString('es-CL')}
                                </td>
                                <td className="inv-td-der">{renderBadge(rep.estado)}</td>
                                <td className="inv-td-der">
                                  <button
                                    type="button"
                                    onClick={() => abrirModalHistorial(rep.codigo)}
                                    className="inv-btn-sec"
                                  >
                                    Ver historial
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SECCIÓN 3: CATÁLOGO DE EQUIPOS */}
              {tab === 'equipos' && (
                <div>
                  <div className="inv-tabla-cab">
                    <h3>Catálogo de Equipos</h3>
                  </div>

                  <div className="inv-tabla-scroll">
                    <table className="inv-tabla">
                      <thead>
                        <tr>
                          <th>CÓDIGO</th>
                          <th>EQUIPO</th>
                          <th>CATEGORÍA</th>
                          <th>KIT ASIGNADO</th>
                          <th className="inv-th-der">ESTADO</th>
                          <th className="inv-th-der">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todosEquiposFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="inv-tabla-vacio">
                              No se encontraron equipos registrados.
                            </td>
                          </tr>
                        ) : (
                          todosEquiposFiltrados.map((eq) => {
                            const marcaModelo = [eq.marca, eq.modelo].filter(Boolean).join(' ');
                            const debeMostrarDetalle = Boolean(
                              marcaModelo && !eq.nombre.toLowerCase().includes(marcaModelo.toLowerCase())
                            );
                            return (
                              <tr key={eq.codigo}>
                                <td className="inv-td-codigo">{eq.codigo}</td>
                                <td className="inv-td-nombre">
                                  {eq.nombre}
                                  {debeMostrarDetalle && (
                                    <span className="inv-marca-modelo">({marcaModelo})</span>
                                  )}
                                </td>
                                <td className="inv-td-suave">{eq.categoria}</td>
                                <td className={eq.kit ? 'inv-kit-asignado' : 'inv-kit-sin-asignar'}>
                                  {eq.kit?.nombre || 'Repuesto (Sin kit)'}
                                </td>
                                <td className="inv-td-der">{renderBadge(eq.estado)}</td>
                                <td className="inv-td-der">
                                  <button
                                    type="button"
                                    onClick={() => abrirModalHistorial(eq.codigo)}
                                    className="inv-btn-prim"
                                  >
                                    Ver historial
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SECCIÓN 4: TOTALES POR CATEGORÍA Y ESTADO */}
              {tab === 'resumen' && (
                <div className="inv-resumen-grid">
                  {/* Totales por Categoría */}
                  <div className="inv-resumen-card">
                    <h3>Equipos por Categoría</h3>
                    <table className="inv-resumen-tabla">
                      <tbody>
                        {Object.entries(datos?.resumen?.totalesPorCategoria || {}).map(([cat, cant]) => (
                          <tr key={cat}>
                            <td className="inv-resumen-cat">{cat}</td>
                            <td className="inv-resumen-cant-azul">
                              {cant} {cant === 1 ? 'unidad' : 'unidades'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totales por Estado */}
                  <div className="inv-resumen-card">
                    <h3>Equipos por Estado Operativo</h3>
                    <table className="inv-resumen-tabla">
                      <tbody>
                        {Object.entries(datos?.resumen?.totalesPorEstado || {}).map(([est, cant]) => (
                          <tr key={est}>
                            <td>{renderBadge(est)}</td>
                            <td className="inv-resumen-cant-oscuro">
                              {cant} {cant === 1 ? 'unidad' : 'unidades'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL DE HISTORIAL DE EQUIPO */}
      {modalHistorialAbierto && (
        <div onClick={cerrarModalHistorial} className="inv-modal-fondo">
          <div onClick={(e) => e.stopPropagation()} className="inv-modal-caja">
            {cargandoHistorial ? (
              <div className="inv-modal-cargando">
                Cargando historial y trazabilidad del equipo...
              </div>
            ) : errorHistorial ? (
              <div>
                <div className="inv-modal-error">{errorHistorial}</div>
                <div className="inv-modal-pie-sin-borde">
                  <button
                    type="button"
                    onClick={cerrarModalHistorial}
                    className="inv-btn-cerrar-sec"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : datosHistorial ? (
              <>
                {/* Encabezado del Modal */}
                <div className="inv-modal-cab">
                  <div>
                    <h3>Historial del Equipo: {datosHistorial.equipo?.nombre}</h3>
                    <span className="inv-modal-sub">
                      Código: <strong>{datosHistorial.equipo?.codigo}</strong> • Categoría: {datosHistorial.equipo?.categoria}
                      {(datosHistorial.equipo?.marca || datosHistorial.equipo?.modelo) && (
                        <> • Modelo: <strong>{[datosHistorial.equipo.marca, datosHistorial.equipo.modelo].filter(Boolean).join(' ')}</strong></>
                      )}
                    </span>
                  </div>
                  {renderBadge(datosHistorial.equipo?.estado_actual)}
                </div>

                {/* Línea de tiempo */}
                <div className="inv-modal-seccion">
                  <h4 className="inv-modal-seccion-titulo">
                    Trazabilidad y Eventos Cronológicos ({datosHistorial.historial?.length || 0})
                  </h4>

                  {!datosHistorial.historial || datosHistorial.historial.length === 0 ? (
                    <div className="inv-modal-vacio">
                      Este equipo aún no registra movimientos en su historial.
                    </div>
                  ) : (
                    <div className="inv-modal-lista">
                      {datosHistorial.historial.map((item, idx) => (
                        <div key={idx} className="inv-modal-item">
                          <div className="inv-modal-item-cab">
                            {renderBadgeEventoHistorial(item.tipo)}
                            <span className="inv-modal-item-fecha">
                              {new Date(item.fecha).toLocaleString('es-CL')}
                            </span>
                          </div>
                          <p className="inv-modal-item-desc">
                            {formatearDescripcionHistorial(item)}
                          </p>
                          <div className="inv-modal-item-meta">
                            {item.evento && <span><strong>Evento:</strong> {item.evento}</span>}
                            {item.responsable && <span><strong>Responsable:</strong> {item.responsable}</span>}
                            {item.detalle?.observacion && <span><strong>Obs:</strong> {item.detalle.observacion}</span>}
                            {item.detalle?.costo_asociado !== undefined && (
                              <span><strong>Costo:</strong> ${Number(item.detalle.costo_asociado).toLocaleString('es-CL')}</span>
                            )}
                            {item.detalle?.valor_compra !== undefined && (
                              <span><strong>Valor adquisición:</strong> ${Number(item.detalle.valor_compra).toLocaleString('es-CL')}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pie del Modal */}
                <div className="inv-modal-pie">
                  <button
                    type="button"
                    onClick={cerrarModalHistorial}
                    className="inv-btn-cerrar-prim"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}