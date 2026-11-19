import React, { useState, useEffect } from 'react';
import {
  registrarIncidente,
  obtenerIncidentes,
  obtenerEventos,
} from '../services/incidente.service.js';
import { consultarInventario } from '../services/consultarInventario.service.js';
import { obtenerKitsPorEvento } from '../services/salidaKit.service.js';
import '../styles/Incidentes.css';

const TIENE_LETRAS_REGEX = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/;

const obtenerFechaLocalHoy = () => {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

export default function Incidentes() {
  const [incidentes, setIncidentes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [eventos, setEventos] = useState([]);

  const [equiposDelEvento, setEquiposDelEvento] = useState([]);
  const [nombreResponsable, setNombreResponsable] = useState('');

  // Estados para buscar y filtrar Eventos
  const [busquedaEvento, setBusquedaEvento] = useState('');
  const [mostrarListaEventos, setMostrarListaEventos] = useState(false);

  // Estados para buscar y filtrar Equipos en tiempo real
  const [busquedaEquipo, setBusquedaEquipo] = useState('');
  const [mostrarListaEquipos, setMostrarListaEquipos] = useState(false);

  const [formData, setFormData] = useState({
    codigo: '',
    tipo: 'DANO',
    fecha: obtenerFechaLocalHoy(),
    descripcion: '',
    id_evento: '',
    id_trabajador: '',
    costo_reparacion: '',
  });

  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const resIncidentes = await obtenerIncidentes();
      const listaInc = resIncidentes?.data || resIncidentes || [];
      setIncidentes(Array.isArray(listaInc) ? listaInc : []);

      try {
        const resInv = await consultarInventario();
        const payloadInv = resInv?.data || resInv || {};
        const todos = payloadInv.todosLosEquipos || [];
        // Solo equipos OPERATIVOS (excluye DANADO, PERDIDO, ROBADO y DADO_DE_BAJA)
        const operativos = todos.filter((eq) => eq.estado === 'OPERATIVO');
        setEquipos(operativos);
      } catch (e) {
        console.warn('No se pudo cargar inventario de equipos:', e.message);
      }

      try {
        const resEventos = await obtenerEventos();
        const listaEv = resEventos?.data || resEventos || [];
        // Solo eventos CONFIRMADOS o REALIZADOS
        const eventosValidos = (Array.isArray(listaEv) ? listaEv : []).filter((ev) =>
          ['CONFIRMADO', 'REALIZADO'].includes(ev.estado)
        );
        setEventos(eventosValidos);
      } catch (e) {
        console.warn('No se pudo cargar lista de eventos:', e.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEventoChange = async (idEvento, etiquetaEvento = '') => {
    setFormData((prev) => ({ ...prev, id_evento: idEvento, codigo: '', id_trabajador: '' }));
    setBusquedaEvento(etiquetaEvento);
    setMostrarListaEventos(false);
    setBusquedaEquipo('');
    setMostrarListaEquipos(false);
    setEquipoSeleccionado(null);
    setNombreResponsable('');

    if (!idEvento) {
      setEquiposDelEvento([]);
      return;
    }

    try {
      const res = await obtenerKitsPorEvento(idEvento);
      const data = res?.data || res;
      const reservas = data?.reservas || [];

      const listaFiltrada = [];
      reservas.forEach((r) => {
        const respTrabajador = r.salida?.responsable?.trabajador || null;
        const nombreKit = r.kit?.nombre || 'Kit';
        (r.kit?.equipos || []).forEach((eq) => {
          if (eq.estado === 'OPERATIVO') {
            listaFiltrada.push({
              ...eq,
              nombreKit,
              trabajadorResponsable: respTrabajador,
            });
          }
        });
      });

      setEquiposDelEvento(listaFiltrada);
    } catch (error) {
      console.error('Error al filtrar equipos del evento:', error);
      setEquiposDelEvento([]);
    }
  };

  const handleSeleccionarEquipo = (eq) => {
    if (!eq) {
      setFormData((prev) => ({ ...prev, codigo: '', id_trabajador: '' }));
      setBusquedaEquipo('');
      setEquipoSeleccionado(null);
      setNombreResponsable('');
      setMostrarListaEquipos(false);
      return;
    }

    const etiqueta = `${eq.codigo} - ${eq.nombre}${eq.nombreKit ? ` (${eq.nombreKit})` : ''}`;
    setBusquedaEquipo(etiqueta);
    setMostrarListaEquipos(false);
    setEquipoSeleccionado(eq);

    if (formData.id_evento && eq.trabajadorResponsable) {
      setFormData((prev) => ({
        ...prev,
        codigo: eq.codigo,
        id_trabajador: String(eq.trabajadorResponsable.id_trabajador),
      }));
      setNombreResponsable(eq.trabajadorResponsable.nombre || '');
    } else {
      setFormData((prev) => ({
        ...prev,
        codigo: eq.codigo,
        id_trabajador: '',
      }));
      setNombreResponsable('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);

    if (busquedaEvento.trim() !== '' && !formData.id_evento) {
      setMensaje({
        tipo: 'error',
        texto: 'El evento ingresado no es válido. Selecciónalo de la lista o déjalo vacío para Bodega.',
      });
      return;
    }

    if (!formData.codigo) {
      setMensaje({
        tipo: 'error',
        texto: 'Debes seleccionar un equipo válido de la lista desplegable.',
      });
      return;
    }

    if (!TIENE_LETRAS_REGEX.test(formData.descripcion.trim())) {
      setMensaje({
        tipo: 'error',
        texto: 'La descripción del incidente debe incluir texto explicativo (no puede contener solo números o símbolos).',
      });
      return;
    }

    setCargando(true);

    try {
      const payload = {
        ...formData,
        descripcion: formData.descripcion.trim(),
        id_evento: formData.id_evento ? Number(formData.id_evento) : null,
        id_trabajador:
          formData.id_evento && formData.id_trabajador ? Number(formData.id_trabajador) : null,
        costo_reparacion: formData.tipo === 'DANO' ? Number(formData.costo_reparacion) : undefined,
      };

      await registrarIncidente(payload);

      setMensaje({
        tipo: 'exito',
        texto: 'Incidente registrado correctamente. El estado del equipo ha sido actualizado.',
      });

      setFormData({
        codigo: '',
        tipo: 'DANO',
        fecha: obtenerFechaLocalHoy(),
        descripcion: '',
        id_evento: '',
        id_trabajador: '',
        costo_reparacion: '',
      });
      setBusquedaEvento('');
      setMostrarListaEventos(false);
      setBusquedaEquipo('');
      setMostrarListaEquipos(false);
      setEquipoSeleccionado(null);
      setEquiposDelEvento([]);
      setNombreResponsable('');

      cargarDatos();
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto:
          error.response?.data?.message ||
          error.message ||
          'Error al intentar registrar el incidente en el sistema.',
      });
    } finally {
      setCargando(false);
    }
  };

  const renderBadgeIncidente = (tipo) => {
    let claseVariante = '';
    let label = tipo;

    switch (tipo) {
      case 'DANO':
        label = 'Dañado';
        claseVariante = 'inc-badge-dano';
        break;
      case 'PERDIDA':
        label = 'Perdido';
        claseVariante = 'inc-badge-perdida';
        break;
      case 'ROBO':
        label = 'Robado';
        claseVariante = 'inc-badge-robo';
        break;
      default:
        break;
    }

    return (
      <span className={`inc-badge ${claseVariante}`}>
        <span className="inc-badge-punto" />
        <span>{label}</span>
      </span>
    );
  };

  const listaEquiposBase = formData.id_evento ? equiposDelEvento : equipos;
  const hayEvento = Boolean(formData.id_evento);

  const equiposFiltrados = listaEquiposBase.filter((eq) => {
    // Si ya hay un equipo seleccionado y no está escribiendo una búsqueda nueva, mostrar toda la lista disponible
    if (formData.codigo) return true;
    const q = busquedaEquipo.trim().toLowerCase();
    if (!q) return true;
    const texto = `${eq.codigo} - ${eq.nombre} ${eq.nombreKit || ''} ${eq.kit?.nombre || ''}`.toLowerCase();
    return texto.includes(q);
  });

  const textoResponsable = !hayEvento
    ? 'No aplica (Incidente en Bodega)'
    : nombreResponsable
      ? nombreResponsable
      : formData.codigo
        ? 'Sin salida de kit registrada (en bodega)'
        : 'Se asigna automáticamente al elegir equipo';

  const eventosFiltrados = eventos.filter((ev) => {
    if (formData.id_evento) return true;
    const q = busquedaEvento.trim().toLowerCase();
    if (!q) return true;
    const textoCompleto = `evento #${ev.id_evento} - ${ev.tipo || 'transmisión'}`.toLowerCase();
    return textoCompleto.includes(q) || String(ev.id_evento) === q.replace('#', '');
  });

  return (
    <div>
      <div className="inc-cabecera">
        <h3>Registro de Incidentes</h3>
      </div>

      {mensaje && (
        <div
          className={`inc-mensaje ${
            mensaje.tipo === 'exito' ? 'inc-mensaje-exito' : 'inc-mensaje-error'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Formulario de registro */}
      <form onSubmit={handleSubmit} className="inc-form">
        {/* Fila 1: Tipo y Evento */}
        <div className="inc-fila-grid">
          <div>
            <label className="inc-label">Tipo de Incidente</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="inc-select"
            >
              <option value="DANO">Dañado</option>
              <option value="PERDIDA">Perdido</option>
              <option value="ROBO">Robado</option>
            </select>
          </div>

          {/* Buscador con scroll interno para Evento Asociado */}
          <div className="inc-evento-wrap">
            <label className="inc-label">Evento Asociado</label>
            <div className="inc-evento-input-box">
              <input
                type="text"
                value={busquedaEvento}
                onFocus={() => setMostrarListaEventos(true)}
                onBlur={() => setTimeout(() => setMostrarListaEventos(false), 150)}
                onChange={(e) => {
                  const val = e.target.value;
                  setBusquedaEvento(val);
                  if (formData.id_evento) {
                    setFormData((prev) => ({
                      ...prev,
                      id_evento: '',
                      codigo: '',
                      id_trabajador: '',
                    }));
                    setBusquedaEquipo('');
                    setEquipoSeleccionado(null);
                    setEquiposDelEvento([]);
                    setNombreResponsable('');
                  }
                  setMostrarListaEventos(true);
                }}
                placeholder="-- Sin evento / Incidente en Bodega (Buscar...) --"
                className={`inc-evento-input ${
                  busquedaEvento.trim() && !formData.id_evento ? 'aviso' : ''
                }`}
              />
              {busquedaEvento && (
                <button
                  type="button"
                  onClick={() => handleEventoChange('', '')}
                  title="Volver a Incidente en Bodega"
                  className="inc-evento-limpiar"
                >
                  ✕
                </button>
              )}
            </div>

            {mostrarListaEventos && (
              <div className="inc-evento-dropdown">
                <div
                  onMouseDown={() => handleEventoChange('', '')}
                  className={`inc-evento-opcion-bodega ${
                    !formData.id_evento ? 'activo' : ''
                  }`}
                >
                  -- Sin evento / Incidente en Bodega --
                </div>

                {eventosFiltrados.length === 0 ? (
                  <div className="inc-evento-vacio">
                    No se encontraron eventos con "{busquedaEvento}"
                  </div>
                ) : (
                  eventosFiltrados.map((ev) => {
                    const etiqueta = `Evento #${ev.id_evento} - ${ev.tipo || 'Transmisión'}`;
                    const seleccionado = String(formData.id_evento) === String(ev.id_evento);
                    return (
                      <div
                        key={ev.id_evento}
                        onMouseDown={() => handleEventoChange(String(ev.id_evento), etiqueta)}
                        className={`inc-evento-opcion ${seleccionado ? 'seleccionado' : ''}`}
                      >
                        <span>{etiqueta}</span>
                        {ev.fecha && (
                          <span className="inc-evento-opcion-fecha">
                            {new Date(ev.fecha).toLocaleDateString('es-CL', { timeZone: 'UTC' })}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fila 2: Equipo (Buscador filtrable) y Responsable */}
        <div className="inc-fila-grid">
          <div className="inc-evento-wrap">
            <label className="inc-label">Equipo Afectado</label>
            <div className="inc-evento-input-box">
              <input
                type="text"
                value={busquedaEquipo}
                onFocus={() => setMostrarListaEquipos(true)}
                onBlur={() => setTimeout(() => setMostrarListaEquipos(false), 150)}
                onChange={(e) => {
                  setBusquedaEquipo(e.target.value);
                  if (formData.codigo) {
                    setFormData((prev) => ({ ...prev, codigo: '', id_trabajador: '' }));
                    setEquipoSeleccionado(null);
                    setNombreResponsable('');
                  }
                  setMostrarListaEquipos(true);
                }}
                placeholder={
                  hayEvento
                    ? 'Buscar equipo del evento por código o nombre...'
                    : 'Buscar equipo en inventario (Ej: CAM-001)...'
                }
                className={`inc-evento-input ${
                  busquedaEquipo.trim() && !formData.codigo ? 'aviso' : ''
                }`}
              />
              {busquedaEquipo && (
                <button
                  type="button"
                  onClick={() => handleSeleccionarEquipo(null)}
                  title="Limpiar equipo"
                  className="inc-evento-limpiar"
                >
                  ✕
                </button>
              )}
            </div>

            {mostrarListaEquipos && (
              <div className="inc-evento-dropdown">
                {equiposFiltrados.length === 0 ? (
                  <div className="inc-evento-vacio">
                    {hayEvento && listaEquiposBase.length === 0
                      ? 'Este evento no tiene equipos operativos disponibles en kits reservados'
                      : `No se encontraron equipos operativos con "${busquedaEquipo}"`}
                  </div>
                ) : (
                  equiposFiltrados.map((eq) => {
                    const seleccionado = formData.codigo === eq.codigo;
                    const subtitulo = eq.nombreKit || eq.kit?.nombre || 'Repuesto / Bodega';
                    return (
                      <div
                        key={eq.codigo}
                        onMouseDown={() => handleSeleccionarEquipo(eq)}
                        className={`inc-evento-opcion ${seleccionado ? 'seleccionado' : ''}`}
                      >
                        <span>
                          <strong>{eq.codigo}</strong> - {eq.nombre}
                        </span>
                        <span className="inc-evento-opcion-fecha">{subtitulo}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div>
            <label className="inc-label">Trabajador Responsable</label>
            <input
              type="text"
              disabled
              readOnly
              value={textoResponsable}
              className={`inc-input-resp ${nombreResponsable ? 'asignado' : ''}`}
            />
            {nombreResponsable && (
              <span className="inc-nota-resp">
                ✓ Asignado automáticamente según salida de {equipoSeleccionado?.nombreKit}
              </span>
            )}
          </div>
        </div>

        {/* Fila 3: Costo o valorización */}
        {formData.tipo === 'DANO' ? (
          <div>
            <label className="inc-label">Costo Estimado de Reparación ($)</label>
            <input
              type="number"
              min="0"
              placeholder="Ej: 35000"
              value={formData.costo_reparacion}
              onChange={(e) => setFormData({ ...formData, costo_reparacion: e.target.value })}
              required
              className="inc-input"
            />
          </div>
        ) : (
          <div className="inc-aviso-valor">
            La pérdida o robo se valorizará automáticamente según el{' '}
            <strong>valor de compra</strong> registrado en inventario.
            {equipoSeleccionado &&
              ` (Valor activo: $${Number(equipoSeleccionado.valor_compra || 0).toLocaleString('es-CL')})`}
          </div>
        )}

        {/* Fila 4: Descripción */}
        <div>
          <label className="inc-label">Descripción del Incidente</label>
          <textarea
            rows="3"
            maxLength={255}
            placeholder="Detalla qué sucedió con el equipo..."
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            required
            className="inc-textarea"
          />
        </div>

        {/* Botón de envío */}
        <div className="inc-form-acciones">
          <button
            type="submit"
            disabled={cargando}
            className="inc-btn-registrar"
          >
            {cargando ? 'Registrando...' : 'Registrar Incidente'}
          </button>
        </div>
      </form>

      {/* Historial de Incidentes Registrados */}
      <div>
        <div className="inc-historial-cab">
          <h3>Historial de Incidentes Registrados</h3>
        </div>

        <div className="inc-tabla-scroll">
          <table className="inc-tabla">
            <thead>
              <tr>
                <th>FECHA</th>
                <th>EQUIPO</th>
                <th>TIPO</th>
                <th>VALOR / COSTO</th>
                <th>RESPONSABLE</th>
                <th>DESCRIPCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {incidentes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="inc-tabla-vacio">
                    No hay incidentes registrados en el sistema.
                  </td>
                </tr>
              ) : (
                incidentes.map((inc) => (
                  <tr key={inc.id_incidente}>
                    <td className="inc-td-fecha">
                      {new Date(inc.fecha).toLocaleDateString('es-CL')}
                    </td>
                    <td className="inc-td-equipo">
                      <strong>{inc.codigo}</strong>
                      {inc.equipo?.nombre && (
                        <span className="inc-td-equipo-nombre">({inc.equipo.nombre})</span>
                      )}
                    </td>
                    <td>{renderBadgeIncidente(inc.tipo)}</td>
                    <td className="inc-td-valor">
                      ${Number(inc.valor || 0).toLocaleString('es-CL')}
                    </td>
                    <td className="inc-td-resp">
                      {inc.trabajador?.nombre || 'Bodega / General'}
                    </td>
                    <td className="inc-td-desc">{inc.descripcion}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}