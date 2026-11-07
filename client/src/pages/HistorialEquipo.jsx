import React, { useState } from 'react';
import { getHistorialEquipo } from '../services/historialEquipo.service';

// Función para transformar los enums técnicos a español formal
const formatearTexto = (texto) => {
  if (!texto) return '';
  const mapa = {
    DANADO: 'DAÑADO',
    DANO: 'DAÑO',
    PERDIDO: 'PERDIDO',
    PERDIDA: 'PÉRDIDA',
    ROBADO: 'ROBADO',
    ROBO: 'ROBO',
    OPERATIVO: 'OPERATIVO',
    DADO_DE_BAJA: 'DADO DE BAJA',
    DISPONIBLE: 'DISPONIBLE',
    INCOMPLETO: 'INCOMPLETO',
    EN_TERRENO: 'EN TERRENO'
  };
  return mapa[texto] || texto;
};

export default function HistorialEquipo() {
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleBuscar = async (e) => {
    e.preventDefault();
    if (!codigoBusqueda.trim()) return;

    setCargando(true);
    setError('');
    setDatos(null);

    try {
      const data = await getHistorialEquipo(codigoBusqueda.trim());
      setDatos(data);
    } catch (err) {
      setError(err.message || 'Error al obtener el historial');
    } finally {
      setCargando(false);
    }
  };

  const getBadgeColor = (tipo) => {
    switch (tipo) {
      case 'SALIDA': return '#2563eb';
      case 'RETORNO': return '#16a34a';
      case 'INCIDENTE': return '#dc2626';
      case 'BAJA': return '#4b5563';
      case 'COMPRA': return '#0891b2';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
        Historial del Equipo
      </h2>

      {/* Formulario de búsqueda */}
      <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Ingrese código de equipo (ej. CAM-001)"
          value={codigoBusqueda}
          onChange={(e) => setCodigoBusqueda(e.target.value)}
          style={{
            flex: 1,
            padding: '0.6rem 0.8rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.95rem'
          }}
        />
        <button
          type="submit"
          disabled={cargando}
          style={{
            padding: '0.6rem 1.2rem',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: cargando ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          {cargando ? 'Buscando...' : 'Consultar'}
        </button>
      </form>

      {error && (
        <div style={{ padding: '0.8rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {datos && (
        <div>
          {/* Ficha técnica del equipo */}
          <div style={{ backgroundColor: '#f9fafb', padding: '1.2rem', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>
              {datos.equipo.nombre} ({datos.equipo.codigo})
            </h3>
            
            <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#4b5563' }}>
              <strong>Categoría:</strong> {formatearTexto(datos.equipo.categoria)}
              {datos.equipo.marca && (
                <> | <strong>Marca:</strong> {datos.equipo.marca}</>
              )}
              {datos.equipo.modelo && (
                <> | <strong>Modelo:</strong> {datos.equipo.modelo}</>
              )}
            </p>

            <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#4b5563' }}>
              <strong>Estado Actual:</strong>{' '}
              <span style={{ 
                fontWeight: 'bold', 
                color: datos.equipo.estado_actual === 'OPERATIVO' ? '#16a34a' : '#dc2626' 
              }}>
                {formatearTexto(datos.equipo.estado_actual)}
              </span>
            </p>
          </div>

          {/* Línea de tiempo de movimientos */}
          <h4 style={{ color: '#374151', marginBottom: '1rem' }}>Línea de Tiempo de Movimientos</h4>

          {datos.historial.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No hay registros de movimientos para este equipo.</p>
          ) : (
            <div style={{ position: 'relative', borderLeft: '2px solid #e5e7eb', marginLeft: '1rem', paddingLeft: '1.5rem' }}>
              {datos.historial.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '1.5rem', position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '-2rem',
                      top: '0.25rem',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: getBadgeColor(item.tipo),
                      border: '2px solid #fff'
                    }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span
                      style={{
                        backgroundColor: getBadgeColor(item.tipo),
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px'
                      }}
                    >
                      {item.tipo}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      {new Date(item.fecha).toLocaleString()}
                    </span>
                  </div>

                  <p style={{ margin: '0.2rem 0', fontWeight: '500', color: '#1f2937' }}>
                    {item.tipo === 'INCIDENTE' && item.detalle?.tipo_incidente
                      ? `Incidente registrado: ${formatearTexto(item.detalle.tipo_incidente)} - ${item.descripcion.includes(' - ') ? item.descripcion.split(' - ')[1] : item.descripcion}`
                      : item.descripcion}
                  </p>

                  <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                    {item.evento && <div><strong>Evento:</strong> {item.evento}</div>}
                    {item.responsable && <div><strong>Responsable:</strong> {item.responsable}</div>}
                    {item.detalle?.observacion && <div><strong>Observación:</strong> {item.detalle.observacion}</div>}
                    {item.detalle?.costo_asociado && (
                      <div><strong>Costo:</strong> ${item.detalle.costo_asociado.toLocaleString()}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}