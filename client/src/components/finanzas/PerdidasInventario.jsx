import { useState, useEffect } from 'react';
import { listarPerdidasInventario } from '../../services/perdidasInventario.service.js';

const MESES = [
  { valor: 1, nombre: 'Enero' },
  { valor: 2, nombre: 'Febrero' },
  { valor: 3, nombre: 'Marzo' },
  { valor: 4, nombre: 'Abril' },
  { valor: 5, nombre: 'Mayo' },
  { valor: 6, nombre: 'Junio' },
  { valor: 7, nombre: 'Julio' },
  { valor: 8, nombre: 'Agosto' },
  { valor: 9, nombre: 'Septiembre' },
  { valor: 10, nombre: 'Octubre' },
  { valor: 11, nombre: 'Noviembre' },
  { valor: 12, nombre: 'Diciembre' },
];

const ETIQUETA_TIPO = {
  DANO: { texto: 'DAÑO', bg: '#fef3c7', color: '#b45309' },
  PERDIDA: { texto: 'PÉRDIDA', bg: '#fee2e2', color: '#b91c1c' },
  ROBO: { texto: 'ROBO', bg: '#fee2e2', color: '#991b1b' },
};

export default function PerdidasInventario() {
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;

  const [anio, setAnio] = useState(anioActual);
  const [mes, setMes] = useState(mesActual);

  const [incidentes, setIncidentes] = useState([]);
  const [totalPerdidas, setTotalPerdidas] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        setError('');
        const res = await listarPerdidasInventario(anio, mes);
        const data = res?.data || res || {};
        setIncidentes(data.incidentes || []);
        setTotalPerdidas(Number(data.total_perdidas || 0));
      } catch (err) {
        setError(err.message || 'Error al cargar el reporte de pérdidas.');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [anio, mes]);

  const nombreMes = MESES.find((m) => m.valor === Number(mes))?.nombre || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Selector de Período */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '1.1rem 1.5rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.92rem' }}>
            Período Contable:
          </span>
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.92rem',
              fontWeight: '600',
              color: '#0f172a',
              backgroundColor: '#ffffff',
            }}
          >
            {MESES.map((m) => {
              const futuro = Number(anio) === anioActual && m.valor > mesActual;
              return (
                <option key={m.valor} value={m.valor} disabled={futuro}>
                  {m.nombre} {futuro ? '(Futuro - Bloqueado)' : ''}
                </option>
              );
            })}
          </select>

          <input
            type="number"
            min="2000"
            max={anioActual}
            value={anio}
            onChange={(e) => {
              const val = Number(e.target.value);
              const nuevoAnio = val > anioActual ? anioActual : val;
              setAnio(nuevoAnio);
              if (nuevoAnio === anioActual && Number(mes) > mesActual) {
                setMes(mesActual);
              }
            }}
            style={{
              width: '88px',
              padding: '0.45rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.92rem',
              fontWeight: '600',
              color: '#0f172a',
            }}
          />
        </div>

        <span style={{ fontWeight: '800', color: '#b91c1c', fontSize: '1rem' }}>
          Total Perdido en el Mes: ${totalPerdidas.toLocaleString('es-CL')}
        </span>
      </div>

      {error && (
        <div
          style={{
            padding: '0.85rem 1.1rem',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '8px',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Tabla RF-P8-03 */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>
          Reporte de Pérdidas de Inventario — {nombreMes} {anio}
        </h3>

        {cargando ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Cargando incidentes del mes...</p>
        ) : incidentes.length === 0 ? (
          <div
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              color: '#64748b',
              fontSize: '0.9rem',
            }}
          >
            No hay incidentes de pérdida, daño o robo registrados en este mes.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '460px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem', textAlign: 'left', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 1 }}>
                  <th style={{ padding: '0.7rem 0.5rem' }}>EQUIPO</th>
                  <th style={{ padding: '0.7rem 0.5rem' }}>TIPO</th>
                  <th style={{ padding: '0.7rem 0.5rem' }}>ORIGEN</th>
                  <th style={{ padding: '0.7rem 0.5rem' }}>RESPONSABLE</th>
                  <th style={{ padding: '0.7rem 0.5rem', textAlign: 'right' }}>VALOR</th>
                </tr>
              </thead>
              <tbody>
                {incidentes.map((inc) => {
                  const badge = ETIQUETA_TIPO[inc.tipo] || {
                    texto: inc.tipo,
                    bg: '#f1f5f9',
                    color: '#475569',
                  };
                  return (
                    <tr key={inc.id_incidente} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 0.5rem', fontWeight: '600', color: '#0f172a' }}>
                        {inc.equipo}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.74rem',
                            fontWeight: '700',
                            backgroundColor: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {badge.texto}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', color: '#475569' }}>{inc.origen}</td>
                      <td style={{ padding: '0.85rem 0.5rem', color: '#475569' }}>{inc.responsable}</td>
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', fontWeight: '700', color: '#b91c1c' }}>
                        ${inc.valor.toLocaleString('es-CL')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}