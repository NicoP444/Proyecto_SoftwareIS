import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, Pencil, Trash2, Paperclip, Receipt, Clock, ArrowRight, Wallet, Check, Ban,
} from 'lucide-react';
import Modal from '../components/Modal';
import FormularioGasto from '../components/FormularioGasto';
import { obtenerUsuario } from '../services/http.js';
import {
  listarEventos, listarTrabajadores, listarGastos, crearGasto, modificarGasto, eliminarGasto,
  listarRendiciones, marcarRendicion, urlEvidencia,
} from '../services/gastoEvento.service.js';
import '../styles/Finanzas.css';

const TIPOS = {
  MOVILIZACION: 'Movilización',
  PEAJE: 'Peaje',
  PASAJE: 'Pasaje',
  ALIMENTACION: 'Alimentación',
  OTRO: 'Otro',
};

const ESTADOS = {
  PENDIENTE: { texto: 'Pendiente', clase: 'pendiente' },
  RENDIDA: { texto: 'Rendida', clase: 'rendida' },
  SIN_GASTOS: { texto: 'Sin gastos', clase: 'sin-gastos' },
};

const clp = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n ?? 0);

// "2026-11-10T00:00:00.000Z" -> "10-11-2026" (sin desfase de zona horaria)
const formatearFecha = (f) => {
  if (!f) return '';
  const [a, m, d] = String(f).slice(0, 10).split('-');
  return `${d}-${m}-${a}`;
};

const EstadoVacio = ({ icono: Icono = Receipt, texto }) => (
  <div className="fin-vacio">
    <Icono size={28} />
    {texto}
  </div>
);

// Ventana para pedir el motivo antes de eliminar (RF-P7-03)
function ConfirmarEliminar({ gasto, onCancelar, onConfirmar }) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (!motivo.trim()) return setError('Indica el motivo de la eliminación');
    setEnviando(true);
    setError('');
    try {
      await onConfirmar(motivo.trim());
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <form className="fin-form" onSubmit={enviar} noValidate>
      {error && <div className="fin-alerta">{error}</div>}
      <p className="fin-texto-suave">
        Vas a eliminar el gasto de <strong>{clp(gasto.monto)}</strong> ({TIPOS[gasto.tipo_gasto]}) de{' '}
        <strong>{gasto.asignacion.trabajador.nombre}</strong>. Quedará registrado en el historial de cambios.
      </p>
      <div className="fin-campo">
        <label htmlFor="motivo-eliminar">Motivo</label>
        <input
          id="motivo-eliminar"
          maxLength={255}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej: Gasto duplicado"
        />
      </div>
      <div className="fin-form-pie">
        <button type="button" className="fin-btn" onClick={onCancelar} disabled={enviando}>Cancelar</button>
        <button type="submit" className="fin-btn fin-btn-peligro" disabled={enviando}>
          {enviando ? 'Eliminando…' : 'Eliminar gasto'}
        </button>
      </div>
    </form>
  );
}

export default function Finanzas() {
  const usuario = obtenerUsuario() ?? {};
  const esContador = String(usuario.rol ?? '').toUpperCase() === 'CONTADOR';
  const idContador = usuario.id_contador ?? usuario.id;

  const [eventos, setEventos] = useState([]);
  const [totalEventos, setTotalEventos] = useState(0);
  const [trabajadores, setTrabajadores] = useState([]);
  const [idEvento, setIdEvento] = useState('');
  const [gastos, setGastos] = useState([]);
  const [rend, setRend] = useState(null);
  const [errorRend, setErrorRend] = useState('');
  const [vista, setVista] = useState('gastos'); // 'gastos' | 'rendiciones'
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('');
  const [version, setVersion] = useState(0);
  const [modalGasto, setModalGasto] = useState({ abierto: false, gasto: null });
  const [gastoAEliminar, setGastoAEliminar] = useState(null);

  const recargar = () => setVersion((v) => v + 1);

  // Eventos: el Contador trabaja con los que ya pasaron a "Realizado" (o "Cerrado")
  useEffect(() => {
    listarEventos()
      .then((lista) => {
        setTotalEventos(lista.length);
        const utiles = lista
          .filter((e) => ['REALIZADO', 'CERRADO'].includes(String(e.estado).toUpperCase()))
          .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
        setEventos(utiles);
        if (utiles.length) setIdEvento(String(utiles[0].id_evento));
      })
      .catch((e) => setError(e.message));
  }, []);

  // Todos los trabajadores: solo se usan si las rendiciones no cargan
  useEffect(() => {
    listarTrabajadores()
      .then(setTrabajadores)
      .catch((e) => setError(e.message));
  }, []);

  // Gastos y rendiciones del evento elegido (por separado: si una falla, la otra se ve igual)
  useEffect(() => {
    if (!idEvento) {
      setGastos([]);
      setRend(null);
      setErrorRend('');
      return;
    }
    let activo = true;
    setCargando(true);
    setError('');
    setErrorRend('');
    Promise.allSettled([listarGastos(idEvento), listarRendiciones(idEvento)])
      .then(([g, r]) => {
        if (!activo) return;
        if (g.status === 'fulfilled') {
          setGastos(g.value);
        } else {
          setGastos([]);
          setError(g.reason.message);
        }
        if (r.status === 'fulfilled') {
          setRend(r.value);
        } else {
          setRend(null);
          setErrorRend(r.reason.message);
        }
      })
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [idEvento, version]);

  const evento = eventos.find((e) => String(e.id_evento) === idEvento);
  const cerrado = String(evento?.estado ?? '').toUpperCase() === 'CERRADO';
  const puedeEditar = esContador && Boolean(idContador) && !cerrado && Boolean(idEvento);
  const resumen = rend?.resumen;
  const totalGastado = gastos.reduce((suma, g) => suma + g.monto, 0);

  const gastosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return gastos.filter((g) => {
      if (tipo && g.tipo_gasto !== tipo) return false;
      if (!q) return true;
      return [g.asignacion?.trabajador?.nombre, g.descripcion, g.origen, g.destino]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [gastos, busqueda, tipo]);

  const rendicionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (rend?.rendiciones ?? []).filter((r) => !q || r.trabajador.toLowerCase().includes(q));
  }, [rend, busqueda]);

  // Trabajadores del formulario: los asignados al evento si hay rendiciones; si no, todos
  const opcionesTrabajadores = rend
    ? rend.rendiciones.map((r) => ({ id_trabajador: r.id_trabajador, trabajador: r.trabajador }))
    : trabajadores.map((t) => ({ id_trabajador: t.id_trabajador, trabajador: t.nombre }));

  const KPIS = [
    { titulo: 'Total gastado', valor: idEvento ? clp(totalGastado) : '—', nota: `${gastos.length} gastos registrados`, color: 'azul', icono: Wallet },
    { titulo: 'Rendidas', valor: resumen?.rendidas ?? '—', nota: 'Comprobantes entregados', color: 'verde', icono: Check },
    { titulo: 'Pendientes', valor: resumen?.pendientes ?? '—', nota: 'Faltan por rendir', color: 'naranja', icono: Clock },
    { titulo: 'Sin gastos', valor: resumen?.sin_gastos ?? '—', nota: 'No tuvieron gastos', color: 'gris', icono: Ban },
  ];

  // ---------- Acciones ----------
  async function guardarGasto(formData) {
    formData.append('id_contador', idContador);
    if (modalGasto.gasto) {
      await modificarGasto(modalGasto.gasto.id_gasto, formData);
    } else {
      formData.append('id_evento', idEvento);
      await crearGasto(formData);
    }
    setModalGasto({ abierto: false, gasto: null });
    recargar();
  }

  async function confirmarEliminar(motivo) {
    await eliminarGasto(gastoAEliminar.id_gasto, { id_contador: idContador, motivo });
    setGastoAEliminar(null);
    recargar();
  }

  async function marcar(rendicion, estado) {
    setError('');
    try {
      await marcarRendicion(rendicion.id_asignacion, { id_contador: idContador, estado_rendicion: estado });
      recargar();
    } catch (e) {
      setError(e.message);
    }
  }

  // ---------- Pantalla ----------
  return (
    <div className="finanzas">
      <div className="fin-cabecera">
        <div>
          <h1>Finanzas</h1>
          <p>Gastos y rendiciones de los eventos realizados</p>
        </div>
        <button
          type="button"
          className="fin-btn fin-btn-primario"
          disabled={!puedeEditar}
          onClick={() => setModalGasto({ abierto: true, gasto: null })}
        >
          <Plus size={18} /> Registrar gasto
        </button>
      </div>

      {!esContador && (
        <div className="fin-alerta fin-alerta-info">
          Inicia sesión como Contador para registrar, modificar o eliminar gastos.
        </div>
      )}
      {esContador && !idContador && (
        <div className="fin-alerta">No se encontró el id del contador en la sesión.</div>
      )}
      {cerrado && (
        <div className="fin-alerta fin-alerta-info">Este evento está cerrado: los gastos son solo de lectura.</div>
      )}
      {eventos.length === 0 && totalEventos > 0 && (
        <div className="fin-alerta fin-alerta-info">
          Hay {totalEventos} eventos, pero ninguno está en estado Realizado. Cuando uno pase a Realizado aparecerá aquí.
        </div>
      )}
      {error && <div className="fin-alerta">{error}</div>}

      {/* Resumen */}
      <section className="fin-kpis">
        {KPIS.map(({ titulo, valor, nota, color, icono: Icono }) => (
          <div key={titulo} className={`fin-kpi fin-kpi-${color}`}>
            <span className="fin-kpi-titulo">
              <Icono size={18} />
              {titulo}
            </span>
            <span className="fin-kpi-valor">{valor}</span>
            <span className="fin-kpi-nota">{nota}</span>
          </div>
        ))}
      </section>

      {/* Filtros */}
      <section className="fin-filtros">
        <div className="fin-busqueda">
          <Search size={18} />
          <input
            type="text"
            placeholder={vista === 'gastos' ? 'Buscar por trabajador o descripción' : 'Buscar por trabajador'}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="fin-campo fin-filtro">
          <label htmlFor="filtro-evento">Evento</label>
          <select id="filtro-evento" value={idEvento} onChange={(e) => setIdEvento(e.target.value)}>
            {eventos.length === 0 && <option value="">Sin eventos realizados</option>}
            {eventos.map((ev) => (
              <option key={ev.id_evento} value={ev.id_evento}>
                {ev.tipo} · {formatearFecha(ev.fecha)}{ev.cliente?.nombre ? ` · ${ev.cliente.nombre}` : ''}
              </option>
            ))}
          </select>
        </div>
        {vista === 'gastos' && (
          <div className="fin-campo fin-filtro">
            <label htmlFor="filtro-tipo">Tipo de gasto</label>
            <select id="filtro-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              {Object.entries(TIPOS).map(([valor, texto]) => (
                <option key={valor} value={valor}>{texto}</option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* Panel */}
      <section className="fin-panel">
        <div className="fin-panel-cab">
          <div className="fin-tabs">
            <button type="button" className={`fin-tab ${vista === 'gastos' ? 'activa' : ''}`} onClick={() => setVista('gastos')}>
              Gastos del evento
            </button>
            <button type="button" className={`fin-tab ${vista === 'rendiciones' ? 'activa' : ''}`} onClick={() => setVista('rendiciones')}>
              Rendiciones
            </button>
          </div>
          <span className="fin-contador">
            {vista === 'gastos'
              ? `${gastosFiltrados.length} de ${gastos.length}`
              : `${rendicionesFiltradas.length} de ${rend?.rendiciones.length ?? 0}`}
          </span>
        </div>

        {!idEvento ? (
          <EstadoVacio texto="Selecciona un evento realizado para ver sus gastos" />
        ) : cargando ? (
          <EstadoVacio icono={Clock} texto="Cargando…" />
        ) : vista === 'gastos' ? (
          gastosFiltrados.length === 0 ? (
            <EstadoVacio texto="No hay gastos registrados para este evento" />
          ) : (
            <div className="fin-grid">
              {gastosFiltrados.map((g) => (
                <article key={g.id_gasto} className="fin-card">
                  <div className="fin-card-cab">
                    <span className="fin-avatar">{g.asignacion.trabajador.nombre.charAt(0).toUpperCase()}</span>
                    <div className="fin-card-titulo">
                      <strong>{g.asignacion.trabajador.nombre}</strong>
                      <span className="fin-sub">{TIPOS[g.tipo_gasto]}</span>
                    </div>
                    <span className="fin-monto">{clp(g.monto)}</span>
                  </div>

                  <div className="fin-detalle">
                    <span className="fin-detalle-fila">
                      <Clock size={15} /> {formatearFecha(g.fecha)}
                    </span>
                    {g.tipo_gasto === 'MOVILIZACION' && (
                      <span className="fin-detalle-fila">
                        {g.origen} <ArrowRight size={15} /> {g.destino}
                      </span>
                    )}
                    {g.descripcion && (
                      <span className="fin-detalle-fila">
                        <Receipt size={15} /> {g.descripcion}
                      </span>
                    )}
                  </div>

                  <div className="fin-card-pie">
                    <a className="fin-enlace" href={urlEvidencia(g.evidencia)} target="_blank" rel="noreferrer">
                      <Paperclip size={14} /> Evidencia
                    </a>
                    {puedeEditar && (
                      <div className="fin-acciones">
                        <button type="button" className="fin-icono-btn" aria-label="Editar gasto" onClick={() => setModalGasto({ abierto: true, gasto: g })}>
                          <Pencil size={16} />
                        </button>
                        <button type="button" className="fin-icono-btn fin-icono-peligro" aria-label="Eliminar gasto" onClick={() => setGastoAEliminar(g)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )
        ) : errorRend ? (
          <div className="fin-alerta">No se pudieron cargar las rendiciones: {errorRend}</div>
        ) : rendicionesFiltradas.length === 0 ? (
          <EstadoVacio texto="Este evento no tiene trabajadores asignados" />
        ) : (
          <div className="fin-grid">
            {rendicionesFiltradas.map((r) => {
              const estado = ESTADOS[r.estado_rendicion];
              return (
                <article key={r.id_asignacion} className="fin-card">
                  <div className="fin-card-cab">
                    <span className="fin-avatar">{r.trabajador.charAt(0).toUpperCase()}</span>
                    <div className="fin-card-titulo">
                      <strong>{r.trabajador}</strong>
                      <span className="fin-sub">{r.rol}</span>
                    </div>
                    <span className={`fin-estado fin-estado-${estado.clase}`}>{estado.texto}</span>
                  </div>

                  <div className="fin-detalle">
                    <span className="fin-detalle-fila">
                      <Receipt size={15} /> {r.cantidad_gastos} {r.cantidad_gastos === 1 ? 'gasto registrado' : 'gastos registrados'}
                    </span>
                  </div>

                  {r.estado_rendicion === 'PENDIENTE' && puedeEditar && (
                    <div className="fin-card-pie">
                      {/* Con gastos solo corresponde "Rendida"; sin gastos, "Sin gastos" */}
                      {r.cantidad_gastos > 0 ? (
                        <button type="button" className="fin-btn fin-btn-primario fin-btn-chico" onClick={() => marcar(r, 'RENDIDA')}>
                          <Check size={15} /> Marcar como rendida
                        </button>
                      ) : (
                        <button type="button" className="fin-btn fin-btn-chico" onClick={() => marcar(r, 'SIN_GASTOS')}>
                          <Ban size={15} /> Marcar sin gastos
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Ventanas emergentes */}
      <Modal
        abierto={modalGasto.abierto}
        onCerrar={() => setModalGasto({ abierto: false, gasto: null })}
        titulo={modalGasto.gasto ? 'Editar gasto' : 'Registrar gasto'}
      >
        <FormularioGasto
          gasto={modalGasto.gasto}
          trabajadores={opcionesTrabajadores}
          tipos={TIPOS}
          onGuardar={guardarGasto}
          onCancelar={() => setModalGasto({ abierto: false, gasto: null })}
        />
      </Modal>

      <Modal abierto={Boolean(gastoAEliminar)} onCerrar={() => setGastoAEliminar(null)} titulo="Eliminar gasto">
        {gastoAEliminar && (
          <ConfirmarEliminar
            gasto={gastoAEliminar}
            onCancelar={() => setGastoAEliminar(null)}
            onConfirmar={confirmarEliminar}
          />
        )}
      </Modal>
    </div>
  );
}