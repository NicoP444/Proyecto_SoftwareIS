import { useState, useEffect } from 'react';
import { obtenerResumenMensual } from '../../services/resumenMensual.service.js';
import { validarPreCierreMes, cerrarMesContable } from '../../services/cierreMes.service.js';

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

export default function ResumenFinancieroMensual() {
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;

  const [anio, setAnio] = useState(anioActual);
  const [mes, setMes] = useState(mesActual);

  const [datos, setDatos] = useState(null);
  const [validacion, setValidacion] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const cargarTodo = async () => {
    try {
      setCargando(true);
      setError('');
      const [resResumen, resValidacion] = await Promise.all([
        obtenerResumenMensual(anio, mes),
        validarPreCierreMes(anio, mes),
      ]);
      setDatos(resResumen?.data || resResumen || null);
      setValidacion(resValidacion?.data || resValidacion || null);
    } catch (err) {
      setError(err.message || 'Error al cargar el resumen financiero mensual.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setExito('');
    cargarTodo();
  }, [anio, mes]);

  const handleCerrarMes = async () => {
    if (!validacion?.puede_cerrar || cerrando) return;

    const hayAdvertencias =
      (validacion?.advertencias?.acuerdos_vencidos?.length || 0) > 0 ||
      (validacion?.advertencias?.remuneraciones_pendientes?.length || 0) > 0;

    const mensajeConfirm = hayAdvertencias
      ? `Existen advertencias pendientes en ${nombreMes} ${anio}. ¿Confirmas que deseas cerrar el mes y fijar sus montos de forma definitiva?`
      : `¿Confirmas el cierre contable de ${nombreMes} ${anio}? Una vez cerrado no se podrán registrar nuevos gastos fijos.`;

    if (!window.confirm(mensajeConfirm)) return;

    try {
      setCerrando(true);
      setError('');
      await cerrarMesContable(anio, mes);
      setExito(`El período ${nombreMes} ${anio} fue cerrado y fijado correctamente.`);
      await cargarTodo();
    } catch (err) {
      setError(err.message || 'No se pudo cerrar el mes contable.');
    } finally {
      setCerrando(false);
    }
  };

  const nombreMes = MESES.find((m) => m.valor === Number(mes))?.nombre || '';
  const utilidadNeta = Number(datos?.utilidad_neta || 0);
  const esGanancia = utilidadNeta > 0;
  const esPerdida = utilidadNeta < 0;
  const mesCerrado = datos?.estado === 'CERRADO';

  const eventosAbiertos = validacion?.eventos_abiertos || [];
  const acuerdosVencidos = validacion?.advertencias?.acuerdos_vencidos || [];
  const remunPendientes = validacion?.advertencias?.remuneraciones_pendientes || [];

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              padding: '0.3rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '700',
              backgroundColor: mesCerrado ? '#fee2e2' : '#dcfce7',
              color: mesCerrado ? '#b91c1c' : '#15803d',
            }}
          >
            {mesCerrado ? 'MES CERRADO' : 'MES ABIERTO'}
          </span>

          <span
            style={{
              padding: '0.3rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '800',
              backgroundColor: esGanancia ? '#dcfce7' : esPerdida ? '#fee2e2' : '#f1f5f9',
              color: esGanancia ? '#15803d' : esPerdida ? '#b91c1c' : '#475569',
            }}
          >
            {esGanancia ? 'MES CON GANANCIA' : esPerdida ? 'MES CON PÉRDIDA' : 'EN EQUILIBRIO'}
          </span>
        </div>
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

      {exito && (
        <div
          style={{
            padding: '0.85rem 1.1rem',
            backgroundColor: '#dcfce7',
            color: '#166534',
            borderRadius: '8px',
            fontSize: '0.9rem',
          }}
        >
          {exito}
        </div>
      )}

      {/* Tarjetas KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: '4px solid #16a34a' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>
            Total Ingresos ({nombreMes})
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#15803d', marginTop: '0.25rem' }}>
            +${Number(datos?.total_ingresos || 0).toLocaleString('es-CL')}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: '4px solid #dc2626' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>
            Total Egresos y Pérdidas
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#b91c1c', marginTop: '0.25rem' }}>
            -${Number(datos?.total_egresos || 0).toLocaleString('es-CL')}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1.1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            borderTop: `4px solid ${esGanancia ? '#16a34a' : esPerdida ? '#dc2626' : '#333c87'}`,
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>
            Utilidad Neta del Mes
          </span>
          <div
            style={{
              fontSize: '1.45rem',
              fontWeight: '800',
              color: esGanancia ? '#15803d' : esPerdida ? '#b91c1c' : '#0f172a',
              marginTop: '0.25rem',
            }}
          >
            {utilidadNeta < 0 ? '-' : ''}${Math.abs(utilidadNeta).toLocaleString('es-CL')}
          </div>
        </div>
      </div>

      {/* Estado de Resultados detallado (RF-P8-02) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>
          Estado de Resultados — {nombreMes} {anio}
        </h3>

        {cargando ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Calculando resumen financiero...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem', textAlign: 'left' }}>
                <th style={{ padding: '0.7rem 0.5rem' }}>CONCEPTO</th>
                <th style={{ padding: '0.7rem 0.5rem' }}>TIPO</th>
                <th style={{ padding: '0.7rem 0.5rem', textAlign: 'right' }}>MONTO</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.8rem 0.5rem', fontWeight: '600', color: '#0f172a' }}>Ingresos de clientes</td>
                <td style={{ padding: '0.8rem 0.5rem', color: '#15803d', fontWeight: '600' }}>Ingreso</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right', fontWeight: '700', color: '#15803d' }}>
                  +${Number(datos?.ingresos_clientes || 0).toLocaleString('es-CL')}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.8rem 0.5rem', fontWeight: '600', color: '#0f172a' }}>Aportes de auspiciadores</td>
                <td style={{ padding: '0.8rem 0.5rem', color: '#15803d', fontWeight: '600' }}>Ingreso</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right', fontWeight: '700', color: '#15803d' }}>
                  +${Number(datos?.aportes_auspiciadores || 0).toLocaleString('es-CL')}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.8rem 0.5rem', fontWeight: '600', color: '#0f172a' }}>Remuneraciones pagadas</td>
                <td style={{ padding: '0.8rem 0.5rem', color: '#b91c1c', fontWeight: '600' }}>Egreso</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right', fontWeight: '700', color: '#b91c1c' }}>
                  -${Number(datos?.remuneraciones || 0).toLocaleString('es-CL')}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.8rem 0.5rem', fontWeight: '600', color: '#0f172a' }}>Gastos de eventos</td>
                <td style={{ padding: '0.8rem 0.5rem', color: '#b91c1c', fontWeight: '600' }}>Egreso</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right', fontWeight: '700', color: '#b91c1c' }}>
                  -${Number(datos?.gastos_eventos || 0).toLocaleString('es-CL')}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.8rem 0.5rem', fontWeight: '600', color: '#0f172a' }}>Gastos fijos mensuales</td>
                <td style={{ padding: '0.8rem 0.5rem', color: '#b91c1c', fontWeight: '600' }}>Egreso</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right', fontWeight: '700', color: '#b91c1c' }}>
                  -${Number(datos?.gastos_fijos || 0).toLocaleString('es-CL')}
                </td>
              </tr>
              <tr style={{ borderBottom: '2px solid #cbd5e1' }}>
                <td style={{ padding: '0.8rem 0.5rem', fontWeight: '600', color: '#0f172a' }}>Pérdidas de inventario</td>
                <td style={{ padding: '0.8rem 0.5rem', color: '#b91c1c', fontWeight: '600' }}>Pérdida</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right', fontWeight: '700', color: '#b91c1c' }}>
                  -${Number(datos?.perdidas_inventario || 0).toLocaleString('es-CL')}
                </td>
              </tr>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <td style={{ padding: '0.95rem 0.5rem', fontWeight: '800', color: '#0f172a', fontSize: '0.98rem' }}>
                  UTILIDAD NETA DEL PERÍODO
                </td>
                <td style={{ padding: '0.95rem 0.5rem', fontWeight: '800', color: esGanancia ? '#15803d' : esPerdida ? '#b91c1c' : '#475569' }}>
                  {esGanancia ? 'GANANCIA' : esPerdida ? 'PÉRDIDA' : 'EQUILIBRIO'}
                </td>
                <td
                  style={{
                    padding: '0.95rem 0.5rem',
                    textAlign: 'right',
                    fontWeight: '800',
                    fontSize: '1.05rem',
                    color: esGanancia ? '#15803d' : esPerdida ? '#b91c1c' : '#0f172a',
                  }}
                >
                  {utilidadNeta < 0 ? '-' : ''}${Math.abs(utilidadNeta).toLocaleString('es-CL')}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Bloque de Cierre Contable del Mes (RF-P8-05) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>
              Cierre Contable del Mes — {nombreMes} {anio}
            </h3>
            {mesCerrado ? (
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569' }}>
                Cerrado el{' '}
                <strong>
                  {datos?.fecha_cierre
                    ? new Date(datos.fecha_cierre).toLocaleString('es-CL')
                    : '—'}
                </strong>
                {datos?.cerrado_por && (
                  <>
                    {' '}por <strong>{datos.cerrado_por}</strong>
                  </>
                )}
                . Resumen fijado.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                Fija los resultados del período una vez finalizados todos los eventos del mes.
              </p>
            )}
          </div>

          {!mesCerrado && (
            <button
              type="button"
              onClick={handleCerrarMes}
              disabled={!validacion?.puede_cerrar || cerrando}
              style={{
                padding: '0.7rem 1.35rem',
                backgroundColor: !validacion?.puede_cerrar || cerrando ? '#94a3b8' : '#333c87',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: !validacion?.puede_cerrar || cerrando ? 'not-allowed' : 'pointer',
              }}
            >
              {cerrando ? 'Cerrando mes...' : `Cerrar ${nombreMes} ${anio}`}
            </button>
          )}
        </div>

        {/* Bloqueos y advertencias previas al cierre */}
        {!mesCerrado && !cargando && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {eventosAbiertos.length > 0 && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#991b1b',
                  fontSize: '0.86rem',
                }}
              >
                <strong>Bloqueo de cierre:</strong> Hay {eventosAbiertos.length} evento(s) en este mes que aún no están cerrados (Realizado o Cancelado):
                <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0 }}>
                  {eventosAbiertos.map((ev) => (
                    <li key={ev.id_evento}>
                      Evento #{ev.id_evento} · {ev.tipo} ({new Date(ev.fecha).toLocaleDateString('es-CL', { timeZone: 'UTC' })}) — Estado: <strong>{ev.estado}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {acuerdosVencidos.length > 0 && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  color: '#92400e',
                  fontSize: '0.86rem',
                }}
              >
                <strong>Advertencia — Acuerdos vencidos ({acuerdosVencidos.length}):</strong>
                <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0 }}>
                  {acuerdosVencidos.map((a) => (
                    <li key={a.id_acuerdo}>
                      {a.auspiciador} (Venció el {new Date(a.fecha_fin).toLocaleDateString('es-CL', { timeZone: 'UTC' })})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {remunPendientes.length > 0 && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  color: '#92400e',
                  fontSize: '0.86rem',
                }}
              >
                <strong>Advertencia — Remuneraciones sin pagar ({remunPendientes.length}):</strong>
                <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0 }}>
                  {remunPendientes.map((r) => (
                    <li key={r.id_asignacion}>
                      {r.trabajador} en {r.evento} (${r.monto_pactado.toLocaleString('es-CL')})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}