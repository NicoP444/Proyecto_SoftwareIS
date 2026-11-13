import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlertasKitsSinRetorno } from '../../services/alertaKits.service.js';

export default function AlertasKitsSinRetorno() {
  const navigate = useNavigate();
  const [alertasKits, setAlertasKits] = useState([]);
  const [cargandoAlertas, setCargandoAlertas] = useState(true);

  useEffect(() => {
    getAlertasKitsSinRetorno()
      .then((datos) => setAlertasKits(Array.isArray(datos) ? datos : []))
      .catch((err) => console.error('Error al cargar alertas:', err))
      .finally(() => setCargandoAlertas(false));
  }, []);

  return (
    <section className="panel">
      <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>
          Alertas de kits sin retorno (&gt; 24h)
        </h3>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/salida-kits?tab=incidentes')}
            style={{
              padding: '0.45rem 0.85rem',
              backgroundColor: '#f8fafc',
              color: '#333c87',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + Registrar Incidente
          </button>
          <button
            type="button"
            onClick={() => navigate('/salida-kits?tab=revision')}
            style={{
              padding: '0.45rem 0.85rem',
              backgroundColor: '#333c87',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Registrar Retornos →
          </button>
        </div>
      </div>

      {cargandoAlertas ? (
        <div style={{ padding: '1rem', color: '#6b7280' }}>Buscando alertas...</div>
      ) : alertasKits.length === 0 ? (
        <div className="estado-vacio">
          <p>No hay alertas registradas</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
          {alertasKits.map((alerta) => (
            <div
              key={alerta.id_kit}
              style={{
                padding: '0.9rem 1.1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #f87171',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <strong style={{ color: '#991b1b', fontSize: '1rem' }}>{alerta.nombre_kit}</strong>
                <span
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                  }}
                >
                  +{alerta.horas_retraso}h sin retornar
                </span>
              </div>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.88rem', color: '#4b5563' }}>
                <strong>Evento:</strong> {alerta.tipo_evento} ({alerta.direccion}) |{' '}
                <strong>Responsable:</strong> {alerta.responsable}
                {alerta.telefono_responsable && ` (WhatsApp: ${alerta.telefono_responsable})`}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}