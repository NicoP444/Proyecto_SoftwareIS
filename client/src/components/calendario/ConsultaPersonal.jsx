import { useEffect, useMemo, useState } from "react";
import { Phone, Search } from "lucide-react";
import { listarRoles } from "../../services/personalServicio.js";
import { listarPersonalConEstado } from "../../services/asignacion.service.js";

// Estado de la persona para la fecha y horario elegidos
const ESTADOS_FRANJA = {
  DISPONIBLE: { texto: "Disponible", color: "var(--verde)", orden: 0 },
  OCUPADO: { texto: "Ocupado", color: "var(--naranjo)", orden: 1 },
  SIN_DISPONIBILIDAD: { texto: "Sin disponibilidad", color: "var(--texto-tenue)", orden: 2 },
};
// Estado de la cuenta (solo se muestra si no está activa)
const ESTADOS_CUENTA = {
  LICENCIA: { texto: "En licencia", color: "var(--naranjo)", orden: 3 },
  INACTIVO: { texto: "Inactivo", color: "var(--texto-tenue)", orden: 4 },
};

// Para buscar sin importar tildes ni mayúsculas
const normalizar = (texto) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * Ventana "Personal disponible" (RF-P1-03): lista a todo el personal y deja
 * filtrar por nombre, rol y, si se elige una fecha y horario, por disponibilidad.
 */
export default function ConsultaPersonal() {
  const [personal, setPersonal] = useState([]);
  const [roles, setRoles] = useState([]);
  const [buscar, setBuscar] = useState("");
  const [idRol, setIdRol] = useState("");
  const [estado, setEstado] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaTermino, setHoraTermino] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const franjaValida = Boolean(fecha && horaInicio && horaTermino && horaTermino > horaInicio);
  const hayFiltros = Boolean(buscar || idRol || estado || fecha || horaInicio || horaTermino);

  // Roles para el filtro (solo los activos)
  useEffect(() => {
    listarRoles()
      .then((lista) => setRoles(lista.filter((r) => r.estado === "ACTIVO")))
      .catch(() => setRoles([]));
  }, []);

  // Trae a todo el personal; si la franja es válida, con su disponibilidad en ese horario
  useEffect(() => {
    let vigente = true;
    setCargando(true);
    listarPersonalConEstado(franjaValida ? { fecha, hora_inicio: horaInicio, hora_termino: horaTermino } : {})
      .then((lista) => {
        if (!vigente) return;
        setPersonal(lista);
        setError("");
      })
      .catch((err) => vigente && setError(err.message))
      .finally(() => vigente && setCargando(false));
    if (!franjaValida) setEstado(""); // sin franja no hay estado que filtrar
    return () => {
      vigente = false;
    };
  }, [fecha, horaInicio, horaTermino, franjaValida]);

  // Aplica los filtros; con franja, primero los disponibles
  const visibles = useMemo(() => {
    const q = normalizar(buscar.trim());
    const lista = personal.filter(
      (t) =>
        (!q || normalizar(t.nombre).includes(q)) &&
        (!idRol || t.roles.some((r) => r.id_rol === Number(idRol))) &&
        (!estado || t.estado_franja === estado),
    );
    if (!franjaValida) return lista;
    return [...lista].sort((a, b) => ordenDe(a) - ordenDe(b) || a.nombre.localeCompare(b.nombre));
  }, [personal, buscar, idRol, estado, franjaValida]);

  function ordenDe(t) {
    return (ESTADOS_CUENTA[t.estado_cuenta] ?? ESTADOS_FRANJA[t.estado_franja])?.orden ?? 5;
  }

  // Etiqueta que se muestra a la derecha de cada persona
  function etiquetaDe(t) {
    return ESTADOS_CUENTA[t.estado_cuenta] ?? ESTADOS_FRANJA[t.estado_franja] ?? null;
  }

  function limpiar() {
    setBuscar("");
    setIdRol("");
    setEstado("");
    setFecha("");
    setHoraInicio("");
    setHoraTermino("");
  }

  const disponibles = personal.filter((t) => t.estado_franja === "DISPONIBLE").length;

  return (
    <div className="personal-consulta">
      {/* Barra de filtros */}
      <div className="personal-barra">
        <div className="campo campo-busqueda">
          <label htmlFor="pc-buscar">Buscar</label>
          <Search />
          <input
            id="pc-buscar"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Nombre del trabajador"
            autoComplete="off"
          />
        </div>
        <div className="campo">
          <label htmlFor="pc-rol">Rol</label>
          <select id="pc-rol" value={idRol} onChange={(e) => setIdRol(e.target.value)}>
            <option value="">Todos los roles</option>
            {roles.map((r) => (
              <option key={r.id_rol} value={r.id_rol}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>
        {franjaValida && (
          <div className="campo">
            <label htmlFor="pc-estado">Estado en ese horario</label>
            <select id="pc-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="DISPONIBLE">Disponibles</option>
              <option value="OCUPADO">Ocupados</option>
              <option value="SIN_DISPONIBILIDAD">Sin disponibilidad</option>
            </select>
          </div>
        )}
      </div>

      {/* Fecha y horario (opcional) */}
      <div className="personal-franja">
        <span className="etiqueta">Ver disponibilidad en una fecha y horario (opcional)</span>
        <div className="personal-filtros">
          <div className="campo">
            <label htmlFor="pc-fecha">Fecha</label>
            <input id="pc-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="pc-inicio">Desde</label>
            <input id="pc-inicio" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="pc-termino">Hasta</label>
            <input id="pc-termino" type="time" value={horaTermino} onChange={(e) => setHoraTermino(e.target.value)} />
          </div>
        </div>
        {(fecha || horaInicio || horaTermino) && !franjaValida && (
          <p className="texto-tenue">Completa la fecha y un horario válido (la hora final debe ser posterior a la inicial).</p>
        )}
      </div>

      {error && <div className="mensaje mensaje-error">{error}</div>}

      {/* Resumen y limpiar filtros */}
      {!error && !cargando && (
        <div className="personal-resumen">
          <p className="texto-tenue">
            {visibles.length} de {personal.length} {personal.length === 1 ? "persona" : "personas"}
            {franjaValida && ` · ${disponibles} disponibles en ese horario`}
          </p>
          {hayFiltros && (
            <button type="button" className="boton boton-texto" onClick={limpiar}>
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {cargando && personal.length === 0 && <p className="texto-tenue">Cargando personal…</p>}
      {!cargando && !error && personal.length === 0 && (
        <p className="texto-tenue">Aún no hay trabajadores registrados.</p>
      )}
      {!cargando && personal.length > 0 && visibles.length === 0 && (
        <p className="texto-tenue">Ningún trabajador coincide con los filtros.</p>
      )}

      {visibles.length > 0 && (
        <ul className="personal-lista personal-lista-alta">
          {visibles.map((t) => {
            const etiqueta = etiquetaDe(t);
            return (
              <li key={t.id_trabajador} className="personal-fila">
                <div className="personal-datos">
                  <strong>{t.nombre}</strong>
                  <span className="texto-pequeno">
                    <Phone /> {t.telefono_whatsapp}
                  </span>
                  <div className="lista-roles">
                    {t.roles.length === 0 ? (
                      <span className="texto-tenue">Sin roles</span>
                    ) : (
                      t.roles.map((r) => (
                        <span key={r.id_rol} className="chip-rol">
                          {r.nombre}
                        </span>
                      ))
                    )}
                  </div>
                  {t.detalle && <span className="texto-tenue">{t.detalle}</span>}
                </div>
                {etiqueta && (
                  <span className="chip-cal" style={{ "--color": etiqueta.color }}>
                    {etiqueta.texto}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}