import React, { useEffect, useState } from 'react';
import { obtenerIncidentesPorEvento } from '../../services/incidente.service.js';
import '../../styles/ResumenIncidentesEvento.css';

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
    return <p className="rie-cargando">Cargando resumen de incidentes...</p>;
  }

  if (error) {
    return <p className="rie-error">{error}</p>;
  }

  const formatearTipo = {
    DANO: 'DAÑO',
    PERDIDA: 'PÉRDIDA',
    ROBO: 'ROBO',
  };

  // RF-P6-06: Si no hubo incidentes, mostrar el texto exacto
  if (!datos || !datos.incidentes || datos.incidentes.length === 0) {
    return <div className="rie-sin-incidentes">Sin incidentes</div>;
  }

  // RF-P6-06: Detalle de incidentes con equipo y valor
  return (
    <div className="rie-caja">
      <div className="rie-cabecera">
        <span className="rie-cabecera-titulo">
          Resumen de Incidentes ({datos.cantidad || datos.incidentes.length})
        </span>
        <span className="rie-cabecera-total">
          Total pérdidas: ${(datos.totalPerdidas || 0).toLocaleString('es-CL')}
        </span>
      </div>

      <div className="rie-tabla-wrap">
        <table className="rie-tabla">
          <thead>
            <tr>
              <th>Equipo</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th className="rie-th-der">Valor</th>
            </tr>
          </thead>
          <tbody>
            {datos.incidentes.map((inc) => {
              const claseBadge =
                inc.tipo === 'ROBO'
                  ? 'rie-badge-robo'
                  : inc.tipo === 'PERDIDA'
                    ? 'rie-badge-perdida'
                    : '';

              return (
                <tr key={inc.id_incidente}>
                  <td className="rie-td-equipo">
                    {inc.equipo?.nombre || 'Equipo no especificado'}
                    <span className="rie-td-codigo">({inc.codigo})</span>
                  </td>
                  <td>
                    <span className={`rie-badge ${claseBadge}`}>
                      {formatearTipo[inc.tipo] || inc.tipo}
                    </span>
                  </td>
                  <td className="rie-td-desc">{inc.descripcion}</td>
                  <td className="rie-td-valor">
                    ${Number(inc.valor || 0).toLocaleString('es-CL')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}