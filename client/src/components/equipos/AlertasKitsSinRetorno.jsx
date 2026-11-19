import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlertasKitsSinRetorno } from '../../services/alertaKits.service.js';
import { obtenerUsuario } from '../../services/http.js';
import '../../styles/AlertasKitsSinRetorno.css';

export default function AlertasKitsSinRetorno() {
  const navigate = useNavigate();
  const [alertasKits, setAlertasKits] = useState([]);
  const [cargandoAlertas, setCargandoAlertas] = useState(true);
  const esJefe = String(obtenerUsuario()?.rol ?? '').toUpperCase() === 'JEFE_TECNICO';

  useEffect(() => {
    getAlertasKitsSinRetorno()
      .then((datos) => setAlertasKits(Array.isArray(datos) ? datos : []))
      .catch((err) => console.error('Error al cargar alertas:', err))
      .finally(() => setCargandoAlertas(false));
  }, []);

  return (
    <section className="panel">
      <div className="panel-head akr-cabecera">
        <h3>Alertas de kits sin retorno (&gt; 24h)</h3>
        {esJefe && (
          <div className="akr-acciones">
            <button
              type="button"
              className="akr-btn-incidente"
              onClick={() => navigate('/salida-kits?tab=incidentes')}
            >
              + Registrar Incidente
            </button>
            <button
              type="button"
              className="akr-btn-retornos"
              onClick={() => navigate('/salida-kits?tab=revision')}
            >
              Registrar Retornos →
            </button>
          </div>
        )}
      </div>

      {cargandoAlertas ? (
        <div className="akr-cargando">Buscando alertas...</div>
      ) : alertasKits.length === 0 ? (
        <div className="estado-vacio">
          <p>No hay alertas registradas</p>
        </div>
      ) : (
        <div className="akr-lista">
          {alertasKits.map((alerta) => (
            <div key={alerta.id_kit} className="akr-alerta-card">
              <div className="akr-alerta-cab">
                <strong className="akr-alerta-titulo">{alerta.nombre_kit}</strong>
                <span className="akr-badge-retraso">
                  +{alerta.horas_retraso}h sin retornar
                </span>
              </div>
              <p className="akr-alerta-detalle">
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