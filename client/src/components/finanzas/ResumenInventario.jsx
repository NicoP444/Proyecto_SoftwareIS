import { useState, useEffect } from 'react';
import { obtenerResumenInventario } from '../../services/resumenInventario.service.js';
import '../../styles/CierreMensual.css';

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
  const comprados = datos?.comprados || [];
  const bajas = datos?.perdidos_o_bajas || datos?.bajas || [];
  const activos = datos?.activos || [];
  const totales = datos?.totales || {};

  const totalCompras = Number(totales.total_comprado_mes ?? datos?.total_compras ?? 0);
  const totalBajas = Number(totales.total_bajas_mes ?? datos?.total_bajas ?? 0);
  const valorInventarioActivo = Number(totales.valor_inventario_activo ?? datos?.valor_inventario_activo ?? 0);

  return (
    <div className="cm-contenedor">
      {/* Selector de Período */}
      <div className="cm-periodo-barra">
        <div className="cm-periodo-controles">
          <span className="cm-periodo-label">Período Contable:</span>
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="cm-select-mes"
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
            className="cm-input-anio"
          />
        </div>

        <span className="cm-total-azul">
          Valor Inventario Activo: ${valorInventarioActivo.toLocaleString('es-CL')}
        </span>
      </div>

      {error && <div className="cm-alerta-error">{error}</div>}

      {/* KPIs RF-P8-04 */}
      <div className="cm-kpis">
        <div className="cm-kpi cm-kpi-verde">
          <span className="cm-kpi-label">Compras en {nombreMes} ({comprados.length})</span>
          <div className="cm-kpi-valor positivo">
            +${totalCompras.toLocaleString('es-CL')}
          </div>
        </div>

        <div className="cm-kpi cm-kpi-rojo">
          <span className="cm-kpi-label">Bajas / Pérdidas ({bajas.length})</span>
          <div className="cm-kpi-valor negativo">
            -${totalBajas.toLocaleString('es-CL')}
          </div>
        </div>

        <div className="cm-kpi">
          <span className="cm-kpi-label">Inventario Activo ({activos.length} eq.)</span>
          <div className="cm-kpi-valor">
            ${valorInventarioActivo.toLocaleString('es-CL')}
          </div>
        </div>
      </div>

      {/* Tabla 1: Equipos comprados en el mes */}
      <div className="cm-card">
        <div className="cm-card-cab-flex">
          <h3>Equipos Comprados en {nombreMes} {anio}</h3>
          <span className="cm-total-azul">
            Total Compras: ${totalCompras.toLocaleString('es-CL')}
          </span>
        </div>

        {cargando ? (
          <p className="cm-texto-carga">Cargando compras del mes...</p>
        ) : comprados.length === 0 ? (
          <div className="cm-vacio">No se registraron compras de equipos en este mes.</div>
        ) : (
          <div className="cm-tabla-scroll-sm">
            <table className="cm-tabla">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>EQUIPO</th>
                  <th>CATEGORÍA</th>
                  <th>FECHA COMPRA</th>
                  <th className="cm-th-der">VALOR</th>
                </tr>
              </thead>
              <tbody>
                {comprados.map((eq) => (
                  <tr key={eq.codigo}>
                    <td className="cm-td-fuerte">{eq.codigo}</td>
                    <td className="cm-td-texto-oscuro">{eq.nombre}</td>
                    <td className="cm-td-suave">{eq.categoria}</td>
                    <td className="cm-td-suave">
                      {eq.fecha_compra
                        ? new Date(eq.fecha_compra).toLocaleDateString('es-CL', { timeZone: 'UTC' })
                        : '—'}
                    </td>
                    <td className="cm-td-monto-pos">
                      ${Number(eq.valor_compra || 0).toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabla 2: Equipos perdidos, robados o dados de baja */}
      <div className="cm-card">
        <div className="cm-card-cab-flex">
          <h3>Equipos Perdidos o Dados de Baja en {nombreMes} {anio}</h3>
          <span className="cm-total-perdido-cab">
            Total Bajas: ${totalBajas.toLocaleString('es-CL')}
          </span>
        </div>

        {cargando ? (
          <p className="cm-texto-carga">Cargando bajas del mes...</p>
        ) : bajas.length === 0 ? (
          <div className="cm-vacio">No hay equipos perdidos ni dados de baja en este mes.</div>
        ) : (
          <div className="cm-tabla-scroll-sm">
            <table className="cm-tabla">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>EQUIPO</th>
                  <th>MOTIVO / ESTADO</th>
                  <th className="cm-th-der">VALOR</th>
                </tr>
              </thead>
              <tbody>
                {bajas.map((eq, idx) => (
                  <tr key={`${eq.codigo}-${idx}`}>
                    <td className="cm-td-fuerte">{eq.codigo}</td>
                    <td className="cm-td-texto-oscuro">{eq.nombre}</td>
                    <td className="cm-td-texto">{eq.motivo || eq.estado}</td>
                    <td className="cm-td-monto-neg">
                      ${Number(eq.valor || eq.valor_compra || 0).toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabla 3: Inventario activo que se mantiene */}
      <div className="cm-card">
        <div className="cm-card-cab-flex">
          <h3>Inventario Activo ({activos.length} equipos operativos)</h3>
          <span className="cm-total-azul">
            Valor Activo Total: ${valorInventarioActivo.toLocaleString('es-CL')}
          </span>
        </div>

        {cargando ? (
          <p className="cm-texto-carga">Cargando inventario activo...</p>
        ) : activos.length === 0 ? (
          <div className="cm-vacio">No hay equipos activos registrados.</div>
        ) : (
          <div className="cm-tabla-scroll-sm">
            <table className="cm-tabla">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>EQUIPO</th>
                  <th>CATEGORÍA</th>
                  <th>ESTADO</th>
                  <th className="cm-th-der">VALOR ACTIVO</th>
                </tr>
              </thead>
              <tbody>
                {activos.map((eq) => (
                  <tr key={eq.codigo}>
                    <td className="cm-td-fuerte">{eq.codigo}</td>
                    <td className="cm-td-texto-oscuro">{eq.nombre}</td>
                    <td className="cm-td-suave">{eq.categoria}</td>
                    <td className="cm-td-texto">{eq.estado}</td>
                    <td className="cm-td-monto">
                      ${Number(eq.valor_compra || 0).toLocaleString('es-CL')}
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