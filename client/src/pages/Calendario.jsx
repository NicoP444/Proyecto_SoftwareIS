import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import Modal from "../components/Modal";
import {
  listarCoberturas,
  crearCobertura,
  eliminarCobertura,
} from "../services/coberturas.service.js";
import FormularioEvento from "../components/calendario/FormularioEvento";
import GestionClientes from "../components/calendario/GestionClientes";
import { obtenerUsuario } from "../services/http.js";
import "../styles/Calendario.css";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Estados del enum EstadoEvento de Prisma -> texto y clase CSS (color)
const ESTADOS = {
  CONFIRMADO: { texto: "Confirmado", clase: "confirmado" },
  PENDIENTE_ADELANTO: { texto: "Pendiente de adelanto", clase: "pendiente" },
  REALIZADO: { texto: "Realizado", clase: "realizado" },
  CERRADO: { texto: "Cerrado", clase: "cerrado" },
};

// Tarjetas de arriba: al hacer clic filtran por estado
const RESUMEN = [
  {
    estado: "",
    texto: "Coberturas del periodo",
    icono: CalendarDays,
    color: "azul",
  },
  {
    estado: "CONFIRMADO",
    texto: "Confirmadas",
    icono: CalendarCheck,
    color: "verde",
  },
  {
    estado: "PENDIENTE_ADELANTO",
    texto: "Pendientes de adelanto",
    icono: CalendarClock,
    color: "naranjo",
  },
  {
    estado: "REALIZADO",
    texto: "Realizadas",
    icono: CheckCircle2,
    color: "morado",
  },
];

// ---------- Funciones de ayuda ----------

// Date -> "2026-11-05" (sin toISOString, para que no se corra el día por zona horaria)
function clave(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

// El back manda "2026-11-05T00:00:00.000Z": nos quedamos con los 10 primeros caracteres
const claveDe = (evento) => String(evento.fecha).slice(0, 10);

// El back manda "1970-01-01T09:00:00.000Z": nos quedamos con "09:00"
const horaDe = (valor) => (valor ? String(valor).slice(11, 16) : "");

const plata = (n) => "$" + Number(n).toLocaleString("es-CL");
const sumarDias = (fecha, n) =>
  new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + n);

// Todas las celdas del mes, con la semana partiendo en lunes
function celdasDelMes(anio, mes) {
  const vacias = (new Date(anio, mes, 1).getDay() + 6) % 7; // lunes = 0
  const diasMes = new Date(anio, mes + 1, 0).getDate();
  const total = Math.ceil((vacias + diasMes) / 7) * 7;
  return Array.from(
    { length: total },
    (_, i) => new Date(anio, mes, i - vacias + 1),
  );
}

// Los 7 días (lunes a domingo) de la semana de una fecha
function diasDeSemana(fecha) {
  const lunes = sumarDias(fecha, -((fecha.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

export default function Calendario() {
  const hoy = new Date();
  const [fechaBase, setFechaBase] = useState(hoy); // fecha que define el mes o la semana visible
  const [vista, setVista] = useState("mes"); // 'mes' o 'semana'
  const [coberturas, setCoberturas] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [eventoAbierto, setEventoAbierto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [creando, setCreando] = useState(false); // ventana "Nuevo evento"
  const [gestionandoClientes, setGestionandoClientes] = useState(false); // ventana "Clientes"
  const [fechaNueva, setFechaNueva] = useState(""); // fecha que se precarga al crear
  const [errorEliminar, setErrorEliminar] = useState(""); // motivo si el back no deja eliminar
  const [eliminando, setEliminando] = useState(false);
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false); // muestra el campo de motivo
  const [motivoEliminar, setMotivoEliminar] = useState("");

  // RF-P1-12 y RF-P1-13: el Jefe técnico no ve datos financieros
  const rol = obtenerUsuario()?.rol;
  const verFinanzas = rol === "DUENO" || rol === "CONTADOR";
  const puedeCrear = rol === "DUENO"; // RF-P1-05: solo el Dueño agenda eventos
  const puedeEliminar = rol === "DUENO"; // RF-P1-08: solo el Dueño elimina eventos

  // Pedimos las coberturas al back
  async function cargarDatos() {
    try {
      setCoberturas(await listarCoberturas());
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  // Al abrir la página, cargamos los datos
  useEffect(() => {
    cargarDatos();
  }, []);

  function abrirCrear(fecha = "") {
    setFechaNueva(fecha);
    setCreando(true);
  }

  // Cierra el detalle y limpia lo de eliminar
  function cerrarDetalle() {
    setEventoAbierto(null);
    setErrorEliminar("");
    setPidiendoMotivo(false);
    setMotivoEliminar("");
  }

  function cancelarEliminar() {
    setPidiendoMotivo(false);
    setMotivoEliminar("");
    setErrorEliminar("");
  }

  async function manejarEliminar() {
    if (!motivoEliminar.trim()) {
      setErrorEliminar("Debes indicar el motivo de la eliminación");
      return;
    }

    setErrorEliminar("");
    setEliminando(true);
    try {
      await eliminarCobertura(eventoAbierto.id_evento, motivoEliminar.trim());
      cerrarDetalle();
      await cargarDatos(); // recarga el calendario sin el evento
    } catch (err) {
      setErrorEliminar(err.message);
    } finally {
      setEliminando(false);
    }
  }

  async function guardarEvento(datos) {
    await crearCobertura(datos);
    setCreando(false);
    await cargarDatos();
    // Llevamos el calendario a la fecha del evento recién creado
    const [a, m, d] = datos.fecha.split("-").map(Number);
    setFechaBase(new Date(a, m - 1, d));
  }

  const anio = fechaBase.getFullYear();
  const mes = fechaBase.getMonth();
  const dias =
    vista === "mes" ? celdasDelMes(anio, mes) : diasDeSemana(fechaBase);

  // Coberturas que caen dentro del periodo visible
  const claves = dias.map(clave);
  const delPeriodo = useMemo(
    () =>
      coberturas.filter((c) =>
        vista === "mes"
          ? claveDe(c).startsWith(`${anio}-${String(mes + 1).padStart(2, "0")}`)
          : claves.includes(claveDe(c)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [coberturas, vista, anio, mes, fechaBase],
  );

  // Agrupadas por día y ordenadas por hora (aplicando el filtro de estado)
  const porDia = useMemo(() => {
    const mapa = {};
    delPeriodo
      .filter((c) => !filtroEstado || c.estado === filtroEstado)
      .forEach((c) => (mapa[claveDe(c)] = [...(mapa[claveDe(c)] ?? []), c]));
    Object.values(mapa).forEach((l) =>
      l.sort((a, b) =>
        horaDe(a.hora_inicio).localeCompare(horaDe(b.hora_inicio)),
      ),
    );
    return mapa;
  }, [delPeriodo, filtroEstado]);

  const contar = (estado) =>
    estado
      ? delPeriodo.filter((c) => c.estado === estado).length
      : delPeriodo.length;

  // Flechas: saltan un mes o una semana según la vista
  function mover(delta) {
    setFechaBase(
      vista === "mes"
        ? new Date(anio, mes + delta, 1)
        : sumarDias(fechaBase, 7 * delta),
    );
  }

  const titulo =
    vista === "mes"
      ? `${MESES[mes]} ${anio}`
      : `${dias[0].getDate()} ${MESES[dias[0].getMonth()].slice(0, 3)} – ${dias[6].getDate()} ${MESES[dias[6].getMonth()].slice(0, 3)} ${dias[6].getFullYear()}`;

  const claveHoy = clave(hoy);
  const e = eventoAbierto; // atajo para el detalle

  return (
    <div className="cal-pagina">
      <div className="encabezado">
        <div>
          <h1>Calendario</h1>
          <p>Vista general de las transmisiones agendadas</p>
        </div>
        <div className="encabezado-botones">
          {puedeCrear && (
            <>
              <button
                type="button"
                className="boton boton-principal"
                onClick={() => abrirCrear()}
              >
                <Plus size={18} /> Nuevo evento
              </button>
              <button
                type="button"
                className="boton boton-secundario"
                onClick={() => setGestionandoClientes(true)}
              >
                <Users size={18} /> Clientes
              </button>
            </>
          )}
          <div className="cal-selector">
            <button
              type="button"
              className={vista === "mes" ? "activo" : ""}
              onClick={() => setVista("mes")}
            >
              Mes
            </button>
            <button
              type="button"
              className={vista === "semana" ? "activo" : ""}
              onClick={() => setVista("semana")}
            >
              Semana
            </button>
          </div>
          <button
            type="button"
            className="boton boton-secundario"
            onClick={() => setFechaBase(new Date())}
          >
            Hoy
          </button>
          <div className="cal-navegador">
            <button
              type="button"
              className="boton-icono"
              onClick={() => mover(-1)}
              aria-label="Anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <strong>{titulo}</strong>
            <button
              type="button"
              className="boton-icono"
              onClick={() => mover(1)}
              aria-label="Siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="indicadores">
        {RESUMEN.map(({ estado, texto, icono: Icono, color }) => (
          <button
            key={texto}
            type="button"
            className={`indicador ${color} clickeable ${filtroEstado === estado ? "seleccionado" : ""}`}
            onClick={() => setFiltroEstado(estado)}
          >
            <span className="indicador-titulo">
              <Icono size={16} /> {texto}
            </span>
            <strong className="indicador-valor">{contar(estado)}</strong>
          </button>
        ))}
      </div>

      <section className="panel">
        <div className="panel-cabecera">
          <h2>{titulo}</h2>
          <span>
            {filtroEstado ? ESTADOS[filtroEstado].texto : "Todos los estados"}
          </span>
        </div>

        {error && <div className="mensaje mensaje-error">{error}</div>}
        {cargando && <p className="vacio">Cargando coberturas…</p>}
        {!cargando && !error && delPeriodo.length === 0 && (
          <p className="vacio">
            No hay transmisiones agendadas en este periodo.
          </p>
        )}

        <div className="cal-scroll">
          <div className={`cal-grilla ${vista}`}>
            {DIAS.map((d) => (
              <div key={d} className="cal-dia-nombre">
                {d}
              </div>
            ))}

            {dias.map((fecha) => {
              const k = clave(fecha);
              const lista = porDia[k] ?? [];
              const fuera = vista === "mes" && fecha.getMonth() !== mes;
              const limite = vista === "mes" ? 2 : lista.length; // en el mes mostramos 2 y "+N más"
              return (
                <div
                  key={k}
                  className={`cal-celda ${vista === "semana" ? "alta" : ""} ${fuera ? "fuera" : ""} ${k === claveHoy ? "hoy" : ""}`}
                >
                  <span className="cal-numero">{fecha.getDate()}</span>
                  {!fuera &&
                    lista.slice(0, limite).map((c) => (
                      <button
                        key={c.id_evento}
                        type="button"
                        className={`cal-evento ${ESTADOS[c.estado]?.clase ?? "cerrado"}`}
                        onClick={() => setEventoAbierto(c)}
                      >
                        <b>{horaDe(c.hora_inicio)}</b> {c.tipo}
                        <small>{c.cliente?.nombre}</small>
                      </button>
                    ))}
                  {!fuera && lista.length > limite && (
                    <button
                      type="button"
                      className="cal-mas"
                      onClick={() => {
                        setVista("semana");
                        setFechaBase(fecha);
                      }}
                    >
                      +{lista.length - limite} más
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="cal-leyenda">
          {Object.values(ESTADOS).map((s) => (
            <span key={s.clase}>
              <i className={`cal-punto ${s.clase}`} /> {s.texto}
            </span>
          ))}
        </div>
      </section>

      {/* Detalle del evento */}
      <Modal
        abierto={Boolean(e)}
        onCerrar={cerrarDetalle}
        titulo="Detalle de la transmisión"
      >
        {e && (
          <div className="cal-detalle">
            <div className="cal-tarjeta-cabecera">
              <h3>{e.tipo}</h3>
              <span
                className={`chip-cal ${ESTADOS[e.estado]?.clase ?? "cerrado"}`}
              >
                {ESTADOS[e.estado]?.texto ?? e.estado}
              </span>
            </div>
            <p className="texto-pequeno">
              <CalendarDays /> {claveDe(e).split("-").reverse().join("/")}
            </p>
            <p className="texto-pequeno">
              <Clock /> {horaDe(e.hora_inicio)} – {horaDe(e.hora_termino)}
            </p>
            <p className="texto-pequeno">
              <MapPin /> {e.direccion}
            </p>
            <p className="texto-pequeno">
              <Video /> {e.cantidad_camaras}{" "}
              {e.cantidad_camaras === 1 ? "cámara" : "cámaras"} · Cliente:{" "}
              {e.cliente?.nombre ?? "—"}
            </p>
            {verFinanzas && (
              <p className="texto-pequeno">
                <Wallet /> Precio acordado: {plata(e.precio_acordado)}
              </p>
            )}
            {e.observaciones && (
              <p className="texto-tenue">{e.observaciones}</p>
            )}

            {/* Estos bloques aparecen cuando el back los envía (Paso 5) */}
            {e.asignaciones?.length > 0 && (
              <div>
                <span className="etiqueta">Trabajadores</span>
                <div className="lista-roles">
                  {e.asignaciones.map((a) => (
                    <span key={a.id_asignacion} className="chip-rol">
                      {a.trabajador?.nombre} · {a.rol?.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {e.reservas_kit?.length > 0 && (
              <div>
                <span className="etiqueta">Kits</span>
                <div className="lista-roles">
                  {e.reservas_kit.map((r) => (
                    <span key={r.id_reserva} className="chip-rol">
                      {r.kit?.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {e.acuerdos?.length > 0 && (
              <div>
                <span className="etiqueta">Auspiciadores</span>
                <div className="lista-roles">
                  {e.acuerdos.map((a) => (
                    <span key={a.id_acuerdo} className="chip-rol">
                      {a.auspiciador?.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {e.incidentes && (
              <div>
                <span className="etiqueta">Incidentes</span>
                {e.incidentes.length === 0 ? (
                  <p className="texto-tenue">Sin incidentes</p>
                ) : (
                  e.incidentes.map((i) => (
                    <p key={i.id_incidente} className="texto-pequeno">
                      {i.tipo}: {i.descripcion}
                    </p>
                  ))
                )}
              </div>
            )}
            {errorEliminar && (
              <div className="mensaje mensaje-error">{errorEliminar}</div>
            )}
            {puedeEliminar && !pidiendoMotivo && (
              <button
                type="button"
                className="boton boton-peligro"
                onClick={() => setPidiendoMotivo(true)}
              >
                <Trash2 size={16} /> Eliminar cobertura
              </button>
            )}
            {puedeEliminar && pidiendoMotivo && (
              <div className="cal-eliminar">
                <div className="campo">
                  <label htmlFor="motivo-eliminar">
                    Motivo de la eliminación
                  </label>
                  <textarea
                    id="motivo-eliminar"
                    rows={3}
                    maxLength={255}
                    value={motivoEliminar}
                    onChange={(ev) => setMotivoEliminar(ev.target.value)}
                    placeholder="Ej: El cliente canceló el evento"
                  />
                </div>
                <div className="cal-eliminar-botones">
                  <button
                    type="button"
                    className="boton boton-secundario"
                    onClick={cancelarEliminar}
                    disabled={eliminando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="boton boton-peligro"
                    onClick={manejarEliminar}
                    disabled={eliminando || !motivoEliminar.trim()}
                  >
                    <Trash2 size={16} />
                    {eliminando ? "Eliminando…" : "Confirmar eliminación"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Nuevo evento (hermano del detalle, no va dentro de él) */}
      <Modal
        abierto={creando}
        onCerrar={() => setCreando(false)}
        titulo="Nuevo evento"
      >
        <FormularioEvento
          fechaInicial={fechaNueva}
          onGuardar={guardarEvento}
          onCancelar={() => setCreando(false)}
        />
      </Modal>

      {/* Gestión de clientes (RF-P1-01) */}
      <Modal
        abierto={gestionandoClientes}
        onCerrar={() => setGestionandoClientes(false)}
        titulo="Clientes"
        ancho="amplio"
      >
        <GestionClientes onCambio={cargarDatos} />
      </Modal>
    </div>
  );
}