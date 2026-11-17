import { useState, useEffect } from 'react';
import { obtenerResumenMensual } from '../../services/resumenMensual.service.js';
import { validarPreCierreMes, cerrarMesContable } from '../../services/cierreMes.service.js';
import {
  obtenerRegistrosMesCerrado,
  corregirMontoMesCerrado,
} from '../../services/corregirMesCerrado.service.js';
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

export default function ResumenFinancieroMensual() {
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;

  const [anio, setAnio] = useState(anioActual);
  const [mes, setMes] = useState(mesActual);

  const [datos, setDatos] = useState(null);
  const [validacion, setValidacion] = useState(null);
  const [detalleCorreccion, setDetalleCorreccion] = useState({ registros: [], historial: [] });

  const [claveSeleccionada, setClaveSeleccionada] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState('');
  const [motivo, setMotivo] = useState('');

  const [cargando, setCargando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const cargarTodo = async () => {
    try {
      setCargando(true);
      setError('');
      const [resResumen, resValidacion, resCorreccion] = await Promise.all([
        obtenerResumenMensual(anio, mes),
        validarPreCierreMes(anio, mes),
        obtenerRegistrosMesCerrado(anio, mes),
      ]);
      const dataResumen = resResumen?.data || resResumen || null;
      const dataCorr = resCorreccion?.data || resCorreccion || { registros: [], historial: [] };

      setDatos(dataResumen);
      setValidacion(resValidacion?.data || resValidacion || null);
      setDetalleCorreccion(dataCorr);
      setClaveSeleccionada('');
      setNuevoMonto('');
      setMotivo('');
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

  const nombreMes = MESES.find((m) => m.valor === Number(mes))?.nombre || '';

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

  const handleSeleccionarRegistro = (clave) => {
    setClaveSeleccionada(clave);
    const reg = detalleCorreccion.registros.find((r) => r.clave === clave);
    setNuevoMonto(reg ? String(reg.monto) : '');
  };

  const handleCorregirMonto = async (e) => {
    e.preventDefault();
    if (!claveSeleccionada || !nuevoMonto || !motivo.trim() || corrigiendo) return;

    const [tabla, id_registro] = claveSeleccionada.split(':');

    try {
      setCorrigiendo(true);
      setError('');
      setExito('');
      await corregirMontoMesCerrado(anio, mes, {
        tabla,
        id_registro,
        nuevo_monto: Number(nuevoMonto),
        motivo: motivo.trim(),
      });
      setExito('Monto corregido con éxito, registrado en el historial y totales recalculados.');
      await cargarTodo();
    } catch (err) {
      setError(err.message || 'No se pudo aplicar la corrección.');
    } finally {
      setCorrigiendo(false);
    }
  };

  const utilidadNeta = Number(datos?.utilidad_neta || 0);
  const esGanancia = utilidadNeta > 0;
  const esPerdida = utilidadNeta < 0;
  const mesCerrado = datos?.estado === 'CERRADO';

  const eventosAbiertos = validacion?.eventos_abiertos || [];
  const acuerdosVencidos = validacion?.advertencias?.acuerdos_vencidos || [];
  const remunPendientes = validacion?.advertencias?.remuneraciones_pendientes || [];

  const claseResultado = esGanancia ? 'positivo' : esPerdida ? 'negativo' : 'neutro';

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

        <div className="cm-badges-grupo">
          <span className={`cm-badge ${mesCerrado ? 'cm-badge-rojo' : 'cm-badge-verde'}`}>
            {mesCerrado ? 'MES CERRADO' : 'MES ABIERTO'}
          </span>

          <span
            className={`cm-badge cm-badge-extra ${
              esGanancia ? 'cm-badge-verde' : esPerdida ? 'cm-badge-rojo' : 'cm-badge-gris'
            }`}
          >
            {esGanancia ? 'MES CON GANANCIA' : esPerdida ? 'MES CON PÉRDIDA' : 'EN EQUILIBRIO'}
          </span>
        </div>
      </div>

      {error && <div className="cm-alerta-error">{error}</div>}
      {exito && <div className="cm-alerta-exito">{exito}</div>}

      {/* Tarjetas KPI */}
      <div className="cm-kpis">
        <div className="cm-kpi cm-kpi-verde">
          <span className="cm-kpi-label">Total Ingresos ({nombreMes})</span>
          <div className="cm-kpi-valor positivo">
            +${Number(datos?.total_ingresos || 0).toLocaleString('es-CL')}
          </div>
        </div>

        <div className="cm-kpi cm-kpi-rojo">
          <span className="cm-kpi-label">Total Egresos y Pérdidas</span>
          <div className="cm-kpi-valor negativo">
            -${Number(datos?.total_egresos || 0).toLocaleString('es-CL')}
          </div>
        </div>

        <div
          className={`cm-kpi ${
            esGanancia ? 'cm-kpi-verde' : esPerdida ? 'cm-kpi-rojo' : ''
          }`}
        >
          <span className="cm-kpi-label">Utilidad Neta del Mes</span>
          <div className={`cm-kpi-valor ${claseResultado}`}>
            {utilidadNeta < 0 ? '-' : ''}${Math.abs(utilidadNeta).toLocaleString('es-CL')}
          </div>
        </div>
      </div>

      {/* Estado de Resultados detallado (RF-P8-02) */}
      <div className="cm-card">
        <h3 className="cm-card-titulo">
          Estado de Resultados — {nombreMes} {anio}
        </h3>

        {cargando ? (
          <p className="cm-texto-carga">Calculando resumen financiero...</p>
        ) : (
          <table className="cm-tabla-er">
            <thead>
              <tr>
                <th>CONCEPTO</th>
                <th>TIPO</th>
                <th className="cm-th-der">MONTO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="cm-td-fuerte">Ingresos de clientes</td>
                <td className="cm-td-positivo">Ingreso</td>
                <td className="cm-td-monto-pos">
                  +${Number(datos?.ingresos_clientes || 0).toLocaleString('es-CL')}
                </td>
              </tr>
              <tr>
                <td className="cm-td-fuerte">Aportes de auspiciadores</td>
                <td className="cm-td-positivo">Ingreso</td>
                <td className="cm-td-monto-pos">
                  +${Number(datos?.aportes_auspiciadores || 0).toLocaleString('es-CL')}
                </td>
              </tr>
              <tr>
                <td className="cm-td-fuerte">Remuneraciones pagadas</td>
                <td className="cm-td-negativo">Egreso</td>
                <td className="cm-td-monto-neg">
                  -${Number(datos?.remuneraciones || 0).toLocaleString('es-CL')}
                </td>
              </tr>
              <tr>
                <td className="cm-td-fuerte">Gastos de eventos</td>
                <td className="cm-td-negativo">Egreso</td>
                <td className="cm-td-monto-neg">
                  -${Number(datos?.gastos_eventos || 0).toLocaleString('es-CL')}
                </td>
              </tr>
              <tr>
                <td className="cm-td-fuerte">Gastos fijos mensuales</td>
                <td className="cm-td-negativo">Egreso</td>
                <td className="cm-td-monto-neg">
                  -${Number(datos?.gastos_fijos || 0).toLocaleString('es-CL')}
                </td>
              </tr>
              <tr className="cm-fila-borde-doble">
                <td className="cm-td-fuerte">Pérdidas de inventario</td>
                <td className="cm-td-negativo">Pérdida</td>
                <td className="cm-td-monto-neg">
                  -${Number(datos?.perdidas_inventario || 0).toLocaleString('es-CL')}
                </td>
              </tr>
              <tr className="cm-fila-total">
                <td className="cm-total-concepto">UTILIDAD NETA DEL PERÍODO</td>
                <td className={`cm-total-tipo ${claseResultado}`}>
                  {esGanancia ? 'GANANCIA' : esPerdida ? 'PÉRDIDA' : 'EQUILIBRIO'}
                </td>
                <td className={`cm-total-monto ${claseResultado}`}>
                  {utilidadNeta < 0 ? '-' : ''}${Math.abs(utilidadNeta).toLocaleString('es-CL')}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Bloque de Cierre Contable del Mes (RF-P8-05) */}
      <div className="cm-card">
        <div className="cm-cierre-cab">
          <div>
            <h3 className="cm-card-titulo-sin-margen">
              Cierre Contable del Mes — {nombreMes} {anio}
            </h3>
            {mesCerrado ? (
              <p className="cm-cierre-info-cerrado">
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
              <p className="cm-cierre-info-abierto">
                Fija los resultados del período una vez finalizados todos los eventos del mes.
              </p>
            )}
          </div>

          {!mesCerrado && (
            <button
              type="button"
              onClick={handleCerrarMes}
              disabled={!validacion?.puede_cerrar || cerrando}
              className="cm-btn-cierre"
            >
              {cerrando ? 'Cerrando mes...' : `Cerrar ${nombreMes} ${anio}`}
            </button>
          )}
        </div>

        {/* Bloqueos y advertencias previas al cierre */}
        {!mesCerrado && !cargando && (
          <div className="cm-validaciones-lista">
            {eventosAbiertos.length > 0 && (
              <div className="cm-bloqueo-caja">
                <strong>Bloqueo de cierre:</strong> Hay {eventosAbiertos.length} evento(s) en este mes que aún no están cerrados (Realizado o Cerrado):
                <ul className="cm-lista-items">
                  {eventosAbiertos.map((ev) => (
                    <li key={ev.id_evento}>
                      Evento #{ev.id_evento} · {ev.tipo} ({new Date(ev.fecha).toLocaleDateString('es-CL', { timeZone: 'UTC' })}) — Estado: <strong>{ev.estado}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {acuerdosVencidos.length > 0 && (
              <div className="cm-advertencia-caja">
                <strong>Advertencia — Acuerdos vencidos ({acuerdosVencidos.length}):</strong>
                <ul className="cm-lista-items">
                  {acuerdosVencidos.map((a) => (
                    <li key={a.id_acuerdo}>
                      {a.auspiciador} (Venció el {new Date(a.fecha_fin).toLocaleDateString('es-CL', { timeZone: 'UTC' })})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {remunPendientes.length > 0 && (
              <div className="cm-advertencia-caja">
                <strong>Advertencia — Remuneraciones sin pagar ({remunPendientes.length}):</strong>
                <ul className="cm-lista-items">
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

      {/* Bloque RF-P8-06: Corregir un mes cerrado */}
      {mesCerrado && (
        <div className="cm-card cm-card-col">
          <div>
            <h3 className="cm-card-titulo-sin-margen">
              Corrección Auditada de Mes Cerrado — {nombreMes} {anio}
            </h3>
            <p className="cm-card-sub-0">
              Exclusivo Contador: permite corregir montos tras el cierre exigiendo motivo obligatorio y recalculando el evento y el período.
            </p>
          </div>

          {detalleCorreccion.registros.length === 0 ? (
            <div className="cm-vacio-izq">
              No existen movimientos financieros individuales registrados en este mes cerrado para modificar.
            </div>
          ) : (
            <form onSubmit={handleCorregirMonto} className="cm-form-correccion">
              <div>
                <label className="cm-label">REGISTRO A CORREGIR *</label>
                <select
                  required
                  value={claveSeleccionada}
                  onChange={(e) => handleSeleccionarRegistro(e.target.value)}
                  className="cm-select"
                >
                  <option value="">-- Seleccionar movimiento --</option>
                  {detalleCorreccion.registros.map((r) => (
                    <option key={r.clave} value={r.clave}>
                      [{r.categoria}] {r.detalle} — Actual: ${r.monto.toLocaleString('es-CL')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="cm-label">NUEVO MONTO ($) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={nuevoMonto}
                  onChange={(e) => setNuevoMonto(e.target.value)}
                  disabled={!claveSeleccionada}
                  placeholder="Ej: 150000"
                  className="cm-input"
                />
              </div>

              <div>
                <label className="cm-label">MOTIVO DE CORRECCIÓN *</label>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  disabled={!claveSeleccionada}
                  placeholder="Ej: Error de digitación informado por Dueño"
                  className="cm-input"
                />
              </div>

              <button
                type="submit"
                disabled={!claveSeleccionada || !nuevoMonto || !motivo.trim() || corrigiendo}
                className="cm-btn-primario"
              >
                {corrigiendo ? 'Corrigiendo...' : 'Aplicar Corrección'}
              </button>
            </form>
          )}

          {/* Historial de cambios auditados */}
          <div>
            <h4 className="cm-hist-titulo">
              Historial de Correcciones en este Período ({detalleCorreccion.historial.length})
            </h4>

            {detalleCorreccion.historial.length === 0 ? (
              <div className="cm-hist-vacio">
                No se han registrado modificaciones posteriores al cierre.
              </div>
            ) : (
              <div className="cm-tabla-scroll-sm">
                <table className="cm-tabla-hist">
                  <thead>
                    <tr>
                      <th>FECHA Y HORA</th>
                      <th>REGISTRO</th>
                      <th>ANTERIOR</th>
                      <th>NUEVO</th>
                      <th>MOTIVO</th>
                      <th>CONTADOR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalleCorreccion.historial.map((h) => (
                      <tr key={h.id_cambio}>
                        <td className="cm-td-suave">
                          {new Date(h.fecha_hora).toLocaleString('es-CL')}
                        </td>
                        <td className="cm-td-fuerte">{h.dato}</td>
                        <td className="cm-td-negativo">{h.valor_anterior}</td>
                        <td className="cm-td-positivo">{h.valor_nuevo}</td>
                        <td className="cm-td-texto-oscuro">{h.motivo}</td>
                        <td className="cm-td-texto">{h.contador}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}