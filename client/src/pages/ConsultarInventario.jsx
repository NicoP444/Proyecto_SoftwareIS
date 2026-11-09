import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { consultarInventario } from '../services/consultarInventario.service.js';

export default function ConsultarInventario() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [tab, setTab] = useState('kits');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [kitSeleccionado, setKitSeleccionado] = useState(null);

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
    let bg = '#f1f5f9';
    let text = '#475569';

    switch (estado) {
      case 'OPERATIVO':
      case 'DISPONIBLE':
        bg = '#dcfce7';
        text = '#15803d';
        break;
      case 'EN_TERRENO':
        bg = '#dbeafe';
        text = '#1d4ed8';
        break;
      case 'INCOMPLETO':
      case 'DANADO':
      case 'DADO_DE_BAJA':
      case 'PERDIDO':
      case 'ROBADO':
        bg = '#fee2e2';
        text = '#dc2626';
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
        <span>{formatearEstadoTexto(estado)}</span>
      </span>
    );
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Cabecera superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Inventario General
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/home')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1.1rem',
            backgroundColor: '#333c87',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.88rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#272e6b')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#333c87')}
        >
          ← Volver al inicio
        </button>
      </div>

      {/* Indicadores métricos KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: '4px solid #333c87', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#64748b' }}>Total Kits Registrados</span>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
            {datos?.kits?.length || 0}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: '4px solid #16a34a', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#64748b' }}>Repuestos Disponibles</span>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
            {datos?.repuestos?.length || 0}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: '4px solid #0284c7', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#64748b' }}>Total de Equipos</span>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
            {datos?.resumen?.totalEquipos || 0}
          </div>
        </div>
      </div>

      {/* Contenedor tipo Tarjeta sin desbordamiento extraño */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #eef2f6', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        
        {/* Pestañas de navegación SIN scrollbar molesta */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 1.5rem', backgroundColor: '#ffffff', overflow: 'hidden' }}>
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
              style={{
                padding: '1.1rem 1.3rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: tab === item.id ? '700' : '500',
                fontSize: '0.92rem',
                color: tab === item.id ? '#333c87' : '#64748b',
                borderBottom: tab === item.id ? '2.5px solid #333c87' : '2.5px solid transparent',
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
          {error && (
            <div style={{ padding: '0.9rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1.2rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {cargando ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b', fontSize: '0.95rem' }}>
              Cargando información del inventario...
            </div>
          ) : (
            <>
              {/* FILTROS: BUSCADOR + DESPLEGABLE DE ESTADO */}
              {tab !== 'resumen' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                  
                  {/* Buscador de texto */}
                  <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '420px' }}>
                    <svg
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '17px', height: '17px', color: '#94a3b8' }}
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
                      placeholder="Buscar por código correlativo o nombre..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem 0.55rem 2.4rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.88rem',
                        backgroundColor: '#f8fafc',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Filtro por estado desplegable */}
                  <div style={{ width: '200px' }}>
                    <select
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.88rem',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
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
                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                  
                  {/* Lista de Kits a la izquierda CON SCROLLBAR INTERNO */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      Kits Registrados ({kitsFiltrados.length})
                    </div>
                    
                    {/* Contenedor desplazable: altura máxima 420px con scroll suave */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        maxHeight: '440px',
                        overflowY: 'auto',
                        paddingRight: '6px',
                      }}
                    >
                      {kitsFiltrados.length === 0 ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '10px', color: '#94a3b8', fontSize: '0.88rem' }}>
                          No se encontraron kits coincidentes.
                        </div>
                      ) : (
                        kitsFiltrados.map((k) => {
                          const seleccionado = kitSeleccionado?.id_kit === k.id_kit;
                          return (
                            <div
                              key={k.id_kit}
                              onClick={() => setKitSeleccionado(k)}
                              style={{
                                padding: '1rem',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                backgroundColor: seleccionado ? '#f0f4ff' : '#ffffff',
                                border: seleccionado ? '1.5px solid #333c87' : '1px solid #e2e8f0',
                                boxShadow: seleccionado ? '0 2px 8px rgba(51, 60, 135, 0.08)' : 'none',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                                <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{k.nombre}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
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
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', backgroundColor: '#ffffff' }}>
                    {kitSeleccionado ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1.25rem' }}>
                          <div>
                            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '800', color: '#0f172a' }}>
                              {kitSeleccionado.nombre}
                            </h2>
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                              Nivel: <strong>{kitSeleccionado.nivel}</strong> | Recargo referencial: {kitSeleccionado.recargo_pct}%
                            </span>
                          </div>
                          {renderBadge(kitSeleccionado.estado)}
                        </div>

                        {/* Próximos Eventos Asignados */}
                        <div style={{ marginBottom: '1.75rem' }}>
                          <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em' }}>
                            Próximos Eventos Asignados
                          </h4>
                          {kitSeleccionado.proximosEventos?.length === 0 ? (
                            <div style={{ padding: '0.85rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '0.88rem', border: '1px solid #f1f5f9' }}>
                              Sin eventos futuros programados para este kit.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                              {kitSeleccionado.proximosEventos.map((ev) => (
                                <div
                                  key={ev.id_evento}
                                  style={{
                                    padding: '0.75rem 1rem',
                                    backgroundColor: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '8px',
                                    fontSize: '0.88rem',
                                    color: '#166534',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  <div>
                                    <strong>#{ev.id_evento} {ev.tipo}</strong> — {ev.direccion}
                                  </div>
                                  <span style={{ fontWeight: '600' }}>{new Date(ev.fecha).toLocaleDateString()}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Equipos integrantes */}
                        <div>
                          <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em' }}>
                            Equipos Integrantes
                          </h4>
                          <div style={{ overflowX: 'auto', maxHeight: '240px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', position: 'sticky', top: 0, backgroundColor: '#ffffff' }}>
                                  <th style={{ padding: '0.75rem 0.5rem' }}>CÓDIGO</th>
                                  <th style={{ padding: '0.75rem 0.5rem' }}>EQUIPO / MODELO</th>
                                  <th style={{ padding: '0.75rem 0.5rem' }}>CATEGORÍA</th>
                                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>ESTADO</th>
                                </tr>
                              </thead>
                              <tbody>
                                {kitSeleccionado.equipos?.map((eq) => {
                                  const tieneMarcaModelo = Boolean(eq.marca || eq.modelo);
                                  return (
                                    <tr key={eq.codigo} style={{ borderBottom: '1px solid #f8fafc' }}>
                                      <td style={{ padding: '0.85rem 0.5rem', fontWeight: '700', color: '#0f172a' }}>{eq.codigo}</td>
                                      <td style={{ padding: '0.85rem 0.5rem', color: '#1e293b' }}>
                                        {eq.nombre}
                                        {tieneMarcaModelo && (
                                          <span style={{ color: '#64748b', fontSize: '0.82rem', marginLeft: '6px' }}>
                                            ({[eq.marca, eq.modelo].filter(Boolean).join(' ')})
                                          </span>
                                        )}
                                      </td>
                                      <td style={{ padding: '0.85rem 0.5rem', color: '#64748b' }}>{eq.categoria}</td>
                                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                                        {renderBadge(eq.estado)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p style={{ color: '#94a3b8', textAlign: 'center', margin: '2rem 0' }}>Selecciona un kit de la lista izquierda.</p>
                    )}
                  </div>
                </div>
              )}

              {/* SECCIÓN 2: REPUESTOS OPERATIVOS */}
              {tab === 'repuestos' && (
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>
                      Stock de Repuestos
                    </h3>
                  </div>

                  {/* Tabla con scroll vertical de hasta 460px */}
                  <div style={{ overflowX: 'auto', maxHeight: '460px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 1 }}>
                          <th style={{ padding: '0.75rem 0.5rem' }}>CÓDIGO</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>EQUIPO</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>CATEGORÍA</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>MARCA / MODELO</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>VALOR COMPRA</th>
                          <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>ESTADO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repuestosFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                              No hay repuestos que coincidan con la búsqueda.
                            </td>
                          </tr>
                        ) : (
                          repuestosFiltrados.map((rep) => {
                            const marcaModelo = [rep.marca, rep.modelo].filter(Boolean).join(' ');
                            return (
                              <tr key={rep.codigo} style={{ borderBottom: '1px solid #f8fafc' }}>
                                <td style={{ padding: '0.85rem 0.5rem', fontWeight: '700', color: '#0f172a' }}>{rep.codigo}</td>
                                <td style={{ padding: '0.85rem 0.5rem', color: '#1e293b' }}>{rep.nombre}</td>
                                <td style={{ padding: '0.85rem 0.5rem', color: '#64748b' }}>{rep.categoria}</td>
                                <td style={{ padding: '0.85rem 0.5rem', color: '#64748b' }}>
                                  {marcaModelo || '—'}
                                </td>
                                <td style={{ padding: '0.85rem 0.5rem', fontWeight: '600', color: '#0f172a' }}>
                                  ${Number(rep.valor_compra || 0).toLocaleString('es-CL')}
                                </td>
                                <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                                  {renderBadge(rep.estado)}
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

              {/* SECCIÓN 3: BÚSQUEDA GLOBAL DE EQUIPOS */}
              {tab === 'equipos' && (
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>
                      Catálogo de Equipos
                    </h3>
                    
                  </div>

                  {/* Tabla con scroll vertical de hasta 460px */}
                  <div style={{ overflowX: 'auto', maxHeight: '460px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 1 }}>
                          <th style={{ padding: '0.75rem 0.5rem' }}>CÓDIGO</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>EQUIPO</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>CATEGORÍA</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>KIT ASIGNADO</th>
                          <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>ESTADO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todosEquiposFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                              No se encontraron equipos registrados.
                            </td>
                          </tr>
                        ) : (
                          todosEquiposFiltrados.map((eq) => {
                            const tieneMarcaModelo = Boolean(eq.marca || eq.modelo);
                            return (
                              <tr key={eq.codigo} style={{ borderBottom: '1px solid #f8fafc' }}>
                                <td style={{ padding: '0.85rem 0.5rem', fontWeight: '700', color: '#0f172a' }}>{eq.codigo}</td>
                                <td style={{ padding: '0.85rem 0.5rem', color: '#1e293b' }}>
                                  {eq.nombre}
                                  {tieneMarcaModelo && (
                                    <span style={{ color: '#64748b', fontSize: '0.82rem', marginLeft: '6px' }}>
                                      ({[eq.marca, eq.modelo].filter(Boolean).join(' ')})
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '0.85rem 0.5rem', color: '#64748b' }}>{eq.categoria}</td>
                                <td style={{ padding: '0.85rem 0.5rem', fontWeight: '600', color: eq.kit ? '#333c87' : '#64748b' }}>
                                  {eq.kit?.nombre || 'Repuesto (Sin kit)'}
                                </td>
                                <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                                  {renderBadge(eq.estado)}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  
                  {/* Totales por Categoría */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#ffffff' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '700', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.6rem' }}>
                      Equipos por Categoría
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                      <tbody>
                        {Object.entries(datos?.resumen?.totalesPorCategoria || {}).map(([cat, cant]) => (
                          <tr key={cat} style={{ borderBottom: '1px solid #f8fafc' }}>
                            <td style={{ padding: '0.65rem 0', color: '#334155', fontWeight: '500' }}>{cat}</td>
                            <td style={{ padding: '0.65rem 0', textAlign: 'right', fontWeight: '700', color: '#333c87' }}>
                              {cant} {cant === 1 ? 'unidad' : 'unidades'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totales por Estado */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#ffffff' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '700', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.6rem' }}>
                      Equipos por Estado Operativo
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                      <tbody>
                        {Object.entries(datos?.resumen?.totalesPorEstado || {}).map(([est, cant]) => (
                          <tr key={est} style={{ borderBottom: '1px solid #f8fafc' }}>
                            <td style={{ padding: '0.65rem 0' }}>{renderBadge(est)}</td>
                            <td style={{ padding: '0.65rem 0', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
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
    </div>
  );
}