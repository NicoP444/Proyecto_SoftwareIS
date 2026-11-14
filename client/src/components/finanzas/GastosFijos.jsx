import { useState, useEffect } from 'react';
import { listarGastosFijos, registrarGastoFijo } from '../../services/gastosFijos.service.js';
import { API_URL } from '../../services/config.js';

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

export default function GastosFijos() {
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;

  const [anio, setAnio] = useState(anioActual);
  const [mes, setMes] = useState(mesActual);

  const [estadoMes, setEstadoMes] = useState('ABIERTO');
  const [gastos, setGastos] = useState([]);
  const [totalGastos, setTotalGastos] = useState(0);

  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [archivo, setArchivo] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const esMesActual = Number(anio) === anioActual && Number(mes) === mesActual;
  const mesCerrado = estadoMes === 'CERRADO';
  const formularioBloqueado = mesCerrado || !esMesActual || guardando;

  const cargarGastos = async () => {
    try {
      setCargando(true);
      setError('');
      const res = await listarGastosFijos(anio, mes);
      const data = res?.data || res || {};
      setEstadoMes(data.estado || 'ABIERTO');
      setGastos(data.gastos_fijos || []);
      setTotalGastos(Number(data.total_gastos_fijos || 0));
    } catch (err) {
      setError(err.message || 'Error al cargar los gastos fijos del período.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarGastos();
  }, [anio, mes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formularioBloqueado || !descripcion.trim() || !monto) return;

    try {
      setGuardando(true);
      setError('');
      setExito('');

      const formData = new FormData();
      formData.append('anio', Number(anio));
      formData.append('mes', Number(mes));
      formData.append('descripcion', descripcion.trim());
      formData.append('monto', Number(monto));
      if (archivo) {
        formData.append('evidencia', archivo);
      }

      await registrarGastoFijo(formData);

      setDescripcion('');
      setMonto('');
      setArchivo(null);
      e.target.reset();
      setExito('Gasto fijo registrado correctamente.');
      await cargarGastos();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el gasto fijo.');
    } finally {
      setGuardando(false);
    }
  };

  const nombreMesActual = MESES.find((m) => m.valor === Number(mes))?.nombre || '';
  const serverBaseUrl = API_URL.replace(/\/api\/?$/, '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Selector de Período Contable */}
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
                  {m.nombre} {futuro ? '(Bloqueado)' : ''}
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

        <span
          style={{
            padding: '0.3rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '700',
            backgroundColor: mesCerrado
              ? '#fee2e2'
              : !esMesActual
              ? '#fef3c7'
              : '#dcfce7',
            color: mesCerrado
              ? '#b91c1c'
              : !esMesActual
              ? '#b45309'
              : '#15803d',
          }}
        >
          {mesCerrado
            ? 'MES CERRADO'
            : !esMesActual
            ? 'HISTORIAL'
            : 'MES ACTUAL ABIERTO'}
        </span>
      </div>

      {/* Alertas */}
      {error && (
        <div
          style={{
            padding: '0.85rem 1.1rem',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
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
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            fontSize: '0.9rem',
          }}
        >
          {exito}
        </div>
      )}

      {/* Formulario RF-P8-01 */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>
          Registrar Gasto Fijo Mensual
        </h3>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.86rem', color: '#64748b' }}>
          Gastos recurrentes no asociados a un evento (ej. internet satelital, bodega, suscripciones).
        </p>

        {!esMesActual && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.65rem 0.9rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '6px',
              fontSize: '0.84rem',
              color: '#92400e',
            }}
          >
            Estás consultando el historial de un período anterior. Solo se permite registrar gastos fijos en el mes en curso.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.2fr 1.5fr auto',
            gap: '0.85rem',
            alignItems: 'end',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
              DESCRIPCIÓN *
            </label>
            <input
              type="text"
              required
              maxLength={255}
              placeholder="Ej: Internet satelital Starlink"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={formularioBloqueado}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                backgroundColor: formularioBloqueado ? '#f8fafc' : '#ffffff',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
              MONTO ($) *
            </label>
            <input
              type="number"
              required
              min="1"
              max="1000000000"
              step="1"
              placeholder="Ej: 65000"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              disabled={formularioBloqueado}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                backgroundColor: formularioBloqueado ? '#f8fafc' : '#ffffff',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
              COMPROBANTE (OPCIONAL)
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                width: '100%',
                padding: '0.42rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: formularioBloqueado ? '#f8fafc' : '#ffffff',
                cursor: formularioBloqueado ? 'not-allowed' : 'pointer',
                boxSizing: 'border-box',
                height: '40px',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  padding: '0.22rem 0.6rem',
                  backgroundColor: '#d7e1ff',
                  color: '#333c87',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                }}
              >
                Subir archivo
              </span>
              <span
                style={{
                  fontSize: '0.82rem',
                  color: archivo ? '#0f172a' : '#2f5488',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {archivo ? archivo.name : 'PDF o imagen (máx. 5MB)'}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,.pdf"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                disabled={formularioBloqueado}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={formularioBloqueado}
            style={{
              height: '40px',
              padding: '0 1.25rem',
              backgroundColor: formularioBloqueado ? '#94a3b8' : '#333c87',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '0.88rem',
              cursor: formularioBloqueado ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {guardando ? 'Guardando...' : '+ Registrar Gasto Fijo'}
          </button>
        </form>
      </div>

      {/* Tabla de Gastos Fijos del mes (scroll a partir de 8 filas) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>
            Gastos Fijos de {nombreMesActual} {anio}
          </h3>
          <span style={{ fontWeight: '800', color: '#333c87', fontSize: '1rem' }}>
            Total Gastos Fijos: ${Number(totalGastos || 0).toLocaleString('es-CL')}
          </span>
        </div>

        {cargando ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Cargando gastos fijos...</p>
        ) : gastos.length === 0 ? (
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
            No hay gastos fijos registrados para este mes.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '380px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem', textAlign: 'left', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 1 }}>
                  <th style={{ padding: '0.7rem 0.5rem' }}>DESCRIPCIÓN</th>
                  <th style={{ padding: '0.7rem 0.5rem' }}>EVIDENCIA</th>
                  <th style={{ padding: '0.7rem 0.5rem' }}>REGISTRADO POR</th>
                  <th style={{ padding: '0.7rem 0.5rem', textAlign: 'right' }}>MONTO</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map((g) => (
                  <tr key={g.id_gasto_fijo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: '600', color: '#0f172a' }}>
                      {g.descripcion}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', color: '#64748b' }}>
                      {g.evidencia ? (
                        <a
                          href={`${serverBaseUrl}${g.evidencia}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#333c87', fontWeight: '600', textDecoration: 'underline' }}
                        >
                          Ver comprobante
                        </a>
                      ) : (
                        'Sin evidencia'
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', color: '#475569' }}>
                      {g.contador?.nombre || 'Contador'}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                      ${Number(g.monto || 0).toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}