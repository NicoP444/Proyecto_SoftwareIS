import { useState, useEffect } from 'react';
import { obtenerResumenInventario } from '../../services/resumenInventario.service.js';

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

export default function ResumenInventario() {
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;

  const [anio, setAnio] = useState(anioActual);
  const [mes, setMes] = useState(mesActual);

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        setError('');
        const res = await obtenerResumenInventario(anio, mes);
        setDatos(res?.data || res || null);
      } catch (err) {
        setError(err.message || 'Error al cargar el resumen de inventario y compras.');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [anio, mes]);

  const nombreMes = MESES.find((m) => m.valor === Number(mes))?.nombre || '';
  const totales = datos?.totales || {};

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

        <span style={{ fontWeight: '800', color: '#333c87', fontSize: '1rem' }}>
          Valor Inventario Activo: ${Number(totales.valor_inventario_activo || 0).toLocaleString('es-CL')}
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

      {/* Tarjetas resumen del mes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: '4px solid #16a34a' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>
            Compras en {nombreMes} ({totales.cantidad_comprados || 0} eq.)
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#15803d', marginTop: '0.25rem' }}>
            +${Number(totales.total_comprado_mes || 0).toLocaleString('es-CL')}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: '4px solid #dc2626' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>
            Bajas / Pérdidas en {nombreMes} ({totales.cantidad_bajas || 0} eq.)
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#b91c1c', marginTop: '0.25rem' }}>
            -${Number(totales.total_bajas_mes || 0).toLocaleString('es-CL')}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: '4px solid #333c87' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>
            Inventario Activo ({totales.cantidad_activos || 0} eq.)
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>
            ${Number(totales.valor_inventario_activo || 0).toLocaleString('es-CL')}
          </div>
        </div>
      </div>

      {cargando ? (
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Calculando variación de inventario...</p>
      ) : (
        <>
          {/* Tabla 1: Equipos comprados en el mes */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>
                Equipos Comprados — {nombreMes} {anio}
              </h3>
              <span style={{ fontWeight: '700', color: '#15803d', fontSize: '0.92rem' }}>
                Total Compras: ${Number(totales.total_comprado_mes || 0).toLocaleString('es-CL')}
              </span>
            </div>

            {!datos?.comprados?.length ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '0.88rem' }}>
                No se registraron compras de equipos en este mes.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', maxHeight: '380px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.76rem', textAlign: 'left', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 1 }}>
                      <th style={{ padding: '0.65rem 0.5rem' }}>CÓDIGO</th>
                      <th style={{ padding: '0.65rem 0.5rem' }}>EQUIPO</th>
                      <th style={{ padding: '0.65rem 0.5rem' }}>CATEGORÍA</th>
                      <th style={{ padding: '0.65rem 0.5rem' }}>FECHA COMPRA</th>
                      <th style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>VALOR COMPRA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.comprados.map((eq) => (
                      <tr key={eq.codigo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: '700', color: '#0f172a' }}>{eq.codigo}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#1e293b' }}>
                          {eq.nombre} {(eq.marca || eq.modelo) && `(${[eq.marca, eq.modelo].filter(Boolean).join(' ')})`}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>{eq.categoria}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>
                          {new Date(eq.fecha_compra).toLocaleDateString('es-CL', { timeZone: 'UTC' })}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: '700', color: '#15803d' }}>
                          ${eq.valor_compra.toLocaleString('es-CL')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tabla 2: Equipos perdidos o dados de baja en el mes */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>
                Equipos Perdidos o Dados de Baja — {nombreMes} {anio}
              </h3>
              <span style={{ fontWeight: '700', color: '#b91c1c', fontSize: '0.92rem' }}>
                Total Bajas/Pérdidas: ${Number(totales.total_bajas_mes || 0).toLocaleString('es-CL')}
              </span>
            </div>

            {!datos?.perdidos_o_bajas?.length ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '0.88rem' }}>
                No hubo equipos perdidos, robados ni dados de baja en este mes.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', maxHeight: '380px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.76rem', textAlign: 'left', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 1 }}>
                      <th style={{ padding: '0.65rem 0.5rem' }}>CÓDIGO</th>
                      <th style={{ padding: '0.65rem 0.5rem' }}>EQUIPO</th>
                      <th style={{ padding: '0.65rem 0.5rem' }}>MOTIVO</th>
                      <th style={{ padding: '0.65rem 0.5rem' }}>FECHA</th>
                      <th style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>VALOR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.perdidos_o_bajas.map((eq) => (
                      <tr key={eq.codigo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: '700', color: '#0f172a' }}>{eq.codigo}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#1e293b' }}>{eq.nombre}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#b91c1c', fontWeight: '600' }}>{eq.motivo}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>
                          {eq.fecha ? new Date(eq.fecha).toLocaleDateString('es-CL', { timeZone: 'UTC' }) : '—'}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: '700', color: '#b91c1c' }}>
                          ${eq.valor.toLocaleString('es-CL')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tabla 3: Equipos que se mantienen en inventario activo */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>
                Inventario Activo Vigente ({datos?.activos?.length || 0} equipos)
              </h3>
              <span style={{ fontWeight: '700', color: '#333c87', fontSize: '0.92rem' }}>
                Valor Total Activo: ${Number(totales.valor_inventario_activo || 0).toLocaleString('es-CL')}
              </span>
            </div>

            {!datos?.activos?.length ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '0.88rem' }}>
                No hay equipos activos registrados hasta este período.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', maxHeight: '380px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.76rem', textAlign: 'left', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 1 }}>
                      <th style={{ padding: '0.65rem 0.5rem' }}>CÓDIGO</th>
                      <th style={{ padding: '0.65rem 0.5rem' }}>EQUIPO</th>
                      <th style={{ padding: '0.65rem 0.5rem' }}>CATEGORÍA</th>
                      <th style={{ padding: '0.65rem 0.5rem' }}>UBICACIÓN</th>
                      <th style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>VALOR ACTIVO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.activos.map((eq) => (
                      <tr key={eq.codigo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: '700', color: '#0f172a' }}>{eq.codigo}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#1e293b' }}>{eq.nombre}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>{eq.categoria}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>{eq.kit}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                          ${eq.valor_compra.toLocaleString('es-CL')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}