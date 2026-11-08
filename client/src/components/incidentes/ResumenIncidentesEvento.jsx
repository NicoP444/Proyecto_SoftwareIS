import React, { useEffect, useState } from 'react';
import { obtenerIncidentesPorEvento } from '../../services/incidente.service.js';

export default function ResumenIncidentesEvento({ idEvento }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!idEvento) {
      setDatos(null);
      return;
    }

    setCargando(true);
    setError(null);

    obtenerIncidentesPorEvento(idEvento)
      .then((res) => {
        setDatos(res?.data || res);
      })
      .catch((err) => {
        console.error('Error al cargar incidentes:', err);
        setError('No fue posible cargar los incidentes del evento.');
      })
      .finally(() => setCargando(false));
  }, [idEvento]);

  if (!idEvento) return null;

  if (cargando) {
    return <p style={{ color: '#6b7280', fontSize: '0.9rem', fontStyle: 'italic' }}>Cargando resumen de incidentes...</p>;
  }

  if (error) {
    return <p style={{ color: '#dc2626', fontSize: '0.9rem' }}>{error}</p>;
  }

  const formatearTipo = {
    DANO: 'DAÑO',
    PERDIDA: 'PÉRDIDA',
    ROBO: 'ROBO',
  };

  // RF-P6-06: Si no hubo incidentes, mostrar el texto exacto
  if (!datos || !datos.incidentes || datos.incidentes.length === 0) {
    return (
      <div
        style={{
          marginTop: '1rem',
          padding: '0.85rem 1.2rem',
          backgroundColor: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '8px',
          color: '#475569',
          fontSize: '0.95rem',
          fontWeight: '500',
        }}
      >
        Sin incidentes
      </div>
    );
  }

  // RF-P6-06: Detalle de incidentes con equipo y valor
  return (
    <div
      style={{
        marginTop: '1.2rem',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#fef2f2',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #fecaca',
        }}
      >
        <span style={{ fontWeight: '700', color: '#991b1b', fontSize: '0.95rem' }}>
          Resumen de Incidentes ({datos.cantidad || datos.incidentes.length})
        </span>
        <span style={{ fontWeight: '700', color: '#b91c1c', fontSize: '1rem' }}>
          Total pérdidas: ${(datos.totalPerdidas || 0).toLocaleString('es-CL')}
        </span>
      </div>

      <div style={{ padding: '0.75rem 1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
              <th style={{ padding: '0.5rem 0' }}>Equipo</th>
              <th style={{ padding: '0.5rem 0' }}>Tipo</th>
              <th style={{ padding: '0.5rem 0' }}>Descripción</th>
              <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {datos.incidentes.map((inc) => (
              <tr key={inc.id_incidente} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.6rem 0', fontWeight: '600', color: '#1e293b' }}>
                  {inc.equipo?.nombre || 'Equipo no especificado'}
                  <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '6px' }}>
                    ({inc.codigo})
                  </span>
                </td>
                <td style={{ padding: '0.6rem 0' }}>
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      backgroundColor:
                        inc.tipo === 'ROBO'
                          ? '#fee2e2'
                          : inc.tipo === 'PERDIDA'
                          ? '#ffedd5'
                          : '#fef9c3',
                      color:
                        inc.tipo === 'ROBO'
                          ? '#991b1b'
                          : inc.tipo === 'PERDIDA'
                          ? '#9a3412'
                          : '#854d0e',
                    }}
                  >
                    {formatearTipo[inc.tipo] || inc.tipo}
                  </span>
                </td>
                <td style={{ padding: '0.6rem 0', color: '#334155' }}>{inc.descripcion}</td>
                <td
                  style={{
                    padding: '0.6rem 0',
                    textAlign: 'right',
                    fontWeight: '700',
                    color: '#b91c1c',
                  }}
                >
                  ${Number(inc.valor || 0).toLocaleString('es-CL')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}