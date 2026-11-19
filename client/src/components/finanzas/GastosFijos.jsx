import { useState, useEffect, useRef } from 'react';
import {
  listarGastosFijos,
  registrarGastoFijo,
  actualizarGastoFijo,
  eliminarGastoFijo,
} from '../../services/gastosFijos.service.js';
import { API_URL } from '../../services/config.js';
import '../../styles/CierreMensual.css';

const TIENE_LETRAS_REGEX = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/;

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
  const formRef = useRef(null);

  const [anio, setAnio] = useState(anioActual);
  const [mes, setMes] = useState(mesActual);

  const [estadoMes, setEstadoMes] = useState('ABIERTO');
  const [gastos, setGastos] = useState([]);
  const [totalGastos, setTotalGastos] = useState(0);

  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [editandoId, setEditandoId] = useState(null);

  // Estado para desplegable Gestionar y modal de eliminación
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);
  const [gastoAEliminar, setGastoAEliminar] = useState(null);
  const [motivoEliminacion, setMotivoEliminacion] = useState('');
  const [errorModalEliminar, setErrorModalEliminar] = useState('');

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const esMesActual = Number(anio) === anioActual && Number(mes) === mesActual;
  const mesCerrado = estadoMes === 'CERRADO';
  const formularioBloqueado = mesCerrado || !esMesActual || guardando;

  const limpiarFormulario = () => {
    setDescripcion('');
    setMonto('');
    setArchivo(null);
    setEditandoId(null);
    if (formRef.current) formRef.current.reset();
  };

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
    limpiarFormulario();
    setMenuAbiertoId(null);
    cargarGastos();
  }, [anio, mes]);

  useEffect(() => {
    const handleClickFuera = () => setMenuAbiertoId(null);
    document.addEventListener('click', handleClickFuera);
    return () => document.removeEventListener('click', handleClickFuera);
  }, []);

  const handleIniciarEdicion = (gasto) => {
    setError('');
    setExito('');
    setMenuAbiertoId(null);
    setEditandoId(gasto.id_gasto_fijo);
    setDescripcion(gasto.descripcion || '');
    setMonto(String(gasto.monto || ''));
    setArchivo(null);
    if (formRef.current) formRef.current.reset();
  };

  const handleAbrirModalEliminar = (gasto) => {
    setError('');
    setExito('');
    setMenuAbiertoId(null);
    setGastoAEliminar(gasto);
    setMotivoEliminacion('');
    setErrorModalEliminar('');
  };

  const handleCerrarModalEliminar = () => {
    if (guardando) return;
    setGastoAEliminar(null);
    setMotivoEliminacion('');
    setErrorModalEliminar('');
  };

  const handleConfirmarEliminar = async (e) => {
    e.preventDefault();
    if (!gastoAEliminar || guardando) return;

    const motivoLimpio = motivoEliminacion.trim();
    if (!TIENE_LETRAS_REGEX.test(motivoLimpio)) {
      setErrorModalEliminar(
        'El motivo de eliminación debe incluir texto explicativo (no puede ser solo números o símbolos).'
      );
      return;
    }

    try {
      setGuardando(true);
      setError('');
      setExito('');
      setErrorModalEliminar('');
      await eliminarGastoFijo(gastoAEliminar.id_gasto_fijo);
      if (editandoId === gastoAEliminar.id_gasto_fijo) {
        limpiarFormulario();
      }
      setGastoAEliminar(null);
      setMotivoEliminacion('');
      setExito('Gasto fijo eliminado correctamente.');
      await cargarGastos();
    } catch (err) {
      setGastoAEliminar(null);
      setMotivoEliminacion('');
      setError(err.message || 'No se pudo eliminar el gasto fijo.');
    } finally {
      setGuardando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formularioBloqueado || !descripcion.trim() || !monto) return;

    if (!TIENE_LETRAS_REGEX.test(descripcion.trim())) {
      setError('La descripción del gasto fijo debe incluir texto explicativo (no puede contener solo números o símbolos).');
      return;
    }

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

      if (editandoId) {
        await actualizarGastoFijo(editandoId, formData);
        setExito('Gasto fijo actualizado correctamente.');
      } else {
        await registrarGastoFijo(formData);
        setExito('Gasto fijo registrado correctamente.');
      }

      limpiarFormulario();
      await cargarGastos();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el gasto fijo.');
    } finally {
      setGuardando(false);
    }
  };

  const nombreMesActual = MESES.find((m) => m.valor === Number(mes))?.nombre || '';
  const serverBaseUrl = API_URL.replace(/\/api\/?$/, '');

  const claseEstadoBadge = mesCerrado
    ? 'cm-badge-rojo'
    : !esMesActual
      ? 'cm-badge-amarillo'
      : 'cm-badge-verde';

  return (
    <div className="cm-contenedor">
      {/* Selector de Período Contable */}
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
            className="cm-input-anio"
          />
        </div>

        <span className={`cm-badge ${claseEstadoBadge}`}>
          {mesCerrado ? 'MES CERRADO' : !esMesActual ? 'HISTORIAL' : 'MES ACTUAL ABIERTO'}
        </span>
      </div>

      {/* Alertas */}
      {error && <div className="cm-alerta-error">{error}</div>}
      {exito && <div className="cm-alerta-exito">{exito}</div>}

      {/* Formulario RF-P8-01 */}
      <div className="cm-card">
        <div className="cm-card-cab-flex">
          <div>
            <h3 className="cm-card-titulo-lg">
              {editandoId ? 'Modificar Gasto Fijo Mensual' : 'Registrar Gasto Fijo Mensual'}
            </h3>
            <p className="cm-card-sub-0">
              Gastos recurrentes no asociados a un evento (ej. internet satelital, bodega, suscripciones).
            </p>
          </div>
        </div>

        {!esMesActual && (
          <div className="cm-alerta-historial" style={{ marginTop: '1rem' }}>
            Estás consultando el historial de un período anterior. Solo se permite registrar o modificar gastos fijos en el mes en curso.
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="cm-form-gastos" style={{ marginTop: '1rem' }}>
          <div>
            <label className="cm-label">DESCRIPCIÓN *</label>
            <input
              type="text"
              required
              maxLength={255}
              placeholder="Ej: Internet satelital Starlink"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={formularioBloqueado}
              className="cm-input"
            />
          </div>

          <div>
            <label className="cm-label">MONTO ($) *</label>
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
              className="cm-input"
            />
          </div>

          <div>
            <label className="cm-label">
              {editandoId ? 'REEMPLAZAR COMPROBANTE (OPCIONAL)' : 'COMPROBANTE (OPCIONAL)'}
            </label>

            <label className={`cm-file-box ${formularioBloqueado ? 'bloqueado' : ''}`}>
              <span className="cm-file-btn">Subir archivo</span>
              <span className={`cm-file-nombre ${archivo ? 'cargado' : ''}`}>
                {archivo ? archivo.name : 'PDF o imagen (máx. 5MB)'}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,.pdf"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                disabled={formularioBloqueado}
                className="cm-file-hidden"
              />
            </label>
          </div>

          <div className="cm-form-botones">
            {editandoId && (
              <button
                type="button"
                onClick={limpiarFormulario}
                disabled={guardando}
                className="cm-btn-secundario"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={formularioBloqueado}
              className="cm-btn-primario"
            >
              {guardando
                ? 'Guardando...'
                : editandoId
                  ? 'Guardar Cambios'
                  : '+ Registrar Gasto Fijo'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Gastos Fijos del mes */}
      <div className="cm-card">
        <div className="cm-card-cab-flex">
          <h3>
            Gastos Fijos de {nombreMesActual} {anio}
          </h3>
          <span className="cm-total-azul">
            Total Gastos Fijos: ${Number(totalGastos || 0).toLocaleString('es-CL')}
          </span>
        </div>

        {cargando ? (
          <p className="cm-texto-carga">Cargando gastos fijos...</p>
        ) : gastos.length === 0 ? (
          <div className="cm-vacio">
            No hay gastos fijos registrados para este mes.
          </div>
        ) : (
          <div className="cm-tabla-scroll cm-tabla-scroll-gastos">
            <table className="cm-tabla">
              <thead>
                <tr>
                  <th>DESCRIPCIÓN</th>
                  <th>EVIDENCIA</th>
                  <th>REGISTRADO POR</th>
                  <th className="cm-th-der">MONTO</th>
                  {!mesCerrado && esMesActual && <th className="cm-th-der">ACCIONES</th>}
                </tr>
              </thead>
              <tbody>
                {gastos.map((g, idx) => {
                  const abierto = menuAbiertoId === g.id_gasto_fijo;
                  const abrirHaciaArriba = gastos.length > 1 && idx === gastos.length - 1;
                  return (
                    <tr key={g.id_gasto_fijo}>
                      <td className="cm-td-fuerte">{g.descripcion}</td>
                      <td className="cm-td-suave">
                        {g.evidencia ? (
                          <a
                            href={`${serverBaseUrl}${g.evidencia}`}
                            target="_blank"
                            rel="noreferrer"
                            className="cm-enlace"
                          >
                            Ver comprobante
                          </a>
                        ) : (
                          'Sin evidencia'
                        )}
                      </td>
                      <td className="cm-td-texto">{g.contador?.nombre || 'Contador'}</td>
                      <td className="cm-td-monto">
                        ${Number(g.monto || 0).toLocaleString('es-CL')}
                      </td>
                      {!mesCerrado && esMesActual && (
                        <td className="cm-td-monto">
                          <div
                            className="cm-gestionar-wrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setMenuAbiertoId(abierto ? null : g.id_gasto_fijo)
                              }
                              disabled={guardando}
                              className={`cm-btn-gestionar ${abierto ? 'activo' : ''}`}
                            >
                              <span>Gestionar</span>
                              <span className="cm-gestionar-flecha">▾</span>
                            </button>

                            {abierto && (
                              <div className={`cm-gestionar-menu ${abrirHaciaArriba ? 'arriba' : ''}`}>
                                <button
                                  type="button"
                                  onClick={() => handleIniciarEdicion(g)}
                                  className="cm-gestionar-opcion"
                                >
                                  Modificar gasto
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAbrirModalEliminar(g)}
                                  className="cm-gestionar-opcion peligro"
                                >
                                  Eliminar gasto
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {gastoAEliminar && (
        <div className="cm-modal-fondo" onClick={handleCerrarModalEliminar}>
          <div className="cm-modal-caja" onClick={(e) => e.stopPropagation()}>
            <h3 className="cm-modal-titulo">Eliminar Gasto Fijo</h3>
            <p className="cm-modal-sub">
              Estás a punto de eliminar{' '}
              <strong>"{gastoAEliminar.descripcion}"</strong> por{' '}
              <strong>${Number(gastoAEliminar.monto || 0).toLocaleString('es-CL')}</strong>.
              Esta acción actualizará el balance del período.
            </p>

            {errorModalEliminar && (
              <div className="cm-alerta-error" style={{ marginBottom: '0.85rem' }}>
                {errorModalEliminar}
              </div>
            )}

            <form onSubmit={handleConfirmarEliminar}>
              <label className="cm-modal-label">Motivo de la eliminación *</label>
              <textarea
                rows="3"
                required
                maxLength={255}
                placeholder="Indica el motivo por el cual eliminas este gasto fijo..."
                value={motivoEliminacion}
                onChange={(e) => {
                  setMotivoEliminacion(e.target.value);
                  if (errorModalEliminar) setErrorModalEliminar('');
                }}
                disabled={guardando}
                className="cm-modal-textarea"
              />

              <div className="cm-modal-acciones">
                <button
                  type="button"
                  onClick={handleCerrarModalEliminar}
                  disabled={guardando}
                  className="cm-btn-secundario"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!motivoEliminacion.trim() || guardando}
                  className="cm-btn-eliminar-confirmar"
                >
                  {guardando ? 'Eliminando...' : '🗑 Confirmar eliminación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}