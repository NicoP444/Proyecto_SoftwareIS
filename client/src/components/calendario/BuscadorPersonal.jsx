import { useEffect, useState } from "react";
import { Phone, UserPlus } from "lucide-react";
import { listarRoles } from "../../services/personalServicio.js";
import {
  listarPersonalConEstado,
  listarAsignaciones,
  asignarTrabajador,
} from "../../services/asignacion.service.js";

// Cómo se muestra cada estado y si se puede asignar (las reglas son las mismas del back):
//  - Disponible: se asigna sin avisos.
//  - Sin disponibilidad: se permite, pero el back avisa que queda fuera de su disponibilidad.
//  - Ocupado, en licencia o inactivo: el back lo rechaza, así que se muestra bloqueado.
const ESTADOS = {
  DISPONIBLE: {
    texto: "Disponible",
    color: "var(--verde)",
    orden: 0,
    asignable: true,
  },
  SIN_DISPONIBILIDAD: {
    texto: "Sin disponibilidad",
    color: "var(--naranjo)",
    orden: 1,
    asignable: true,
  },
  OCUPADO: {
    texto: "Ocupado",
    color: "var(--rojo)",
    orden: 2,
    asignable: false,
  },
  LICENCIA: {
    texto: "En licencia",
    color: "var(--texto-tenue)",
    orden: 3,
    asignable: false,
  },
  INACTIVO: {
    texto: "Inactivo",
    color: "var(--texto-tenue)",
    orden: 4,
    asignable: false,
  },
};

// Estado de una persona: primero su cuenta (licencia/inactivo) y luego la franja del evento
const estadoDe = (t) =>
  t.estado_cuenta !== "ACTIVO"
    ? t.estado_cuenta
    : (t.estado_franja ?? "DISPONIBLE");

// Por qué no se puede (o qué conviene saber) al lado de su nombre
function motivoDe(t, estado) {
  if (estado === "OCUPADO")
    return `Ocupado ${t.detalle ? t.detalle.replace(/^En /, "en ") : "en otro evento a esa hora"}`;
  if (estado === "SIN_DISPONIBILIDAD")
    return "No registró disponibilidad para esa fecha: se puede asignar, con aviso";
  if (estado === "LICENCIA") return "Está con licencia";
  if (estado === "INACTIVO") return "Su cuenta está inactiva";
  if (t.roles.length === 0) return "No tiene roles asignados";
  return null;
}

// Para buscar sin importar tildes ni mayúsculas ("matias" encuentra a "Matías")
const normalizar = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/**
 * Asignación de personal a un evento (RF-P1-03 y RF-P3-01).
 * Lista a TODO el personal que aún no está en el evento, con su estado para el horario
 * del evento. Quien no se puede asignar aparece bloqueado y con el motivo, en vez de
 * desaparecer de la lista.
 */
export default function BuscadorPersonal({ evento, onAsignado, refresco = 0 }) {
  const [idRol, setIdRol] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [roles, setRoles] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [rolElegido, setRolElegido] = useState({}); // id_trabajador -> id_rol
  const [cargando, setCargando] = useState(false);
  const [asignando, setAsignando] = useState(null); // id del trabajador que se está asignando
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState(null); // { advertencia, textos }
  const [version, setVersion] = useState(0); // sube para volver a buscar

  // Roles para el filtro (solo los activos)
  useEffect(() => {
    listarRoles()
      .then((lista) => setRoles(lista.filter((r) => r.estado === "ACTIVO")))
      .catch(() => setRoles([]));
  }, []);

  // Si el panel quitó a alguien, el aviso de la última asignación ya no corresponde
  useEffect(() => {
    if (refresco) setAviso(null);
  }, [refresco]);

  // Personal con su estado en el horario del evento, sin quienes ya están asignados.
  // Se vuelve a consultar al asignar (version) y cuando el panel quita a alguien (refresco).
  useEffect(() => {
    let vigente = true;
    setCargando(true);
    Promise.all([
      listarPersonalConEstado({
        fecha: evento.fecha,
        hora_inicio: evento.hora_inicio,
        hora_termino: evento.hora_termino,
      }),
      listarAsignaciones(evento.id_evento),
    ])
      .then(([lista, asignados]) => {
        if (!vigente) return;
        const yaEstan = new Set(asignados.map((a) => a.id_trabajador));
        setPersonal(lista.filter((t) => !yaEstan.has(t.id_trabajador)));
        setError("");
      })
      .catch((err) => vigente && setError(err.message))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [
    evento.id_evento,
    evento.fecha,
    evento.hora_inicio,
    evento.hora_termino,
    version,
    refresco,
  ]);

  // Filtro por rol y orden: primero los que se pueden asignar
  const filas = personal
    .filter((t) => !idRol || t.roles.some((r) => r.id_rol === Number(idRol)))
    .filter(
      (t) => !busqueda || normalizar(t.nombre).includes(normalizar(busqueda)),
    )
    .map((t) => {
      const estado = estadoDe(t);
      const info = ESTADOS[estado] ?? ESTADOS.DISPONIBLE;
      return {
        ...t,
        estado,
        info,
        motivo: motivoDe(t, estado),
        asignable: info.asignable && t.roles.length > 0,
      };
    })
    .sort(
      (a, b) =>
        a.info.orden - b.info.orden || a.nombre.localeCompare(b.nombre, "es"),
    );

  const libres = filas.filter((t) => t.estado === "DISPONIBLE").length;

  // Rol con el que se asignaría: el que eligió en la fila, el del filtro o el primero que sabe
  function rolDe(t) {
    if (rolElegido[t.id_trabajador]) return rolElegido[t.id_trabajador];
    const delFiltro = t.roles.find((r) => r.id_rol === Number(idRol));
    return (delFiltro ?? t.roles[0])?.id_rol;
  }

  async function asignar(t) {
    setAsignando(t.id_trabajador);
    setError("");
    setAviso(null);
    try {
      const res = await asignarTrabajador(
        evento.id_evento,
        t.id_trabajador,
        rolDe(t),
      );
      setAviso(
        res.advertencias?.length
          ? { advertencia: true, textos: res.advertencias }
          : {
              advertencia: false,
              textos: [`${t.nombre} fue asignado al evento`],
            },
      );
      setVersion((v) => v + 1);
      onAsignado?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setAsignando(null);
    }
  }

  return (
    <div className="personal-buscador">
      <div className="personal-filtros">
        <div className="campo">
          <label htmlFor="pd-buscar">Buscar por nombre</label>
          <input
            id="pd-buscar"
            type="search"
            placeholder="Ej: Ana"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="pd-rol">Filtrar por rol</label>
          <select
            id="pd-rol"
            value={idRol}
            onChange={(e) => setIdRol(e.target.value)}
          >
            <option value="">Todos los roles</option>
            {roles.map((r) => (
              <option key={r.id_rol} value={r.id_rol}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="mensaje mensaje-error">{error}</div>}
      {aviso && (
        <div
          className={`mensaje ${aviso.advertencia ? "mensaje-aviso" : "mensaje-exito"}`}
        >
          {aviso.advertencia && <strong>Asignado, pero revisa: </strong>}
          {aviso.textos.join(". ")}
        </div>
      )}

      {cargando && personal.length === 0 && (
        <p className="texto-tenue">Buscando…</p>
      )}
      {!cargando && filas.length === 0 && !error && (
        <p className="texto-tenue">
          {busqueda || idRol
            ? "Nadie coincide con la búsqueda o el filtro (o ya están en el evento)."
            : "Todo el personal ya está en este evento."}
        </p>
      )}

      {filas.length > 0 && (
        <>
          <p className="texto-tenue">
            {libres}{" "}
            {libres === 1 ? "persona disponible" : "personas disponibles"} de{" "}
            {filas.length}. Los bloqueados muestran el motivo.
          </p>
          <ul className="personal-lista">
            {filas.map((t) => (
              <li
                key={t.id_trabajador}
                className={`personal-fila${t.asignable ? "" : " personal-bloqueado"}`}
              >
                <div className="personal-datos">
                  <div className="personal-nombre">
                    <strong>{t.nombre}</strong>
                    <span
                      className="chip-cal"
                      style={{ "--color": t.info.color }}
                    >
                      {t.info.texto}
                    </span>
                  </div>
                  <span className="texto-pequeno">
                    <Phone /> {t.telefono_whatsapp}
                  </span>
                  <div className="lista-roles">
                    {t.roles.map((r) => (
                      <span key={r.id_rol} className="chip-rol">
                        {r.nombre}
                      </span>
                    ))}
                  </div>
                  {t.motivo && (
                    <span
                      className={`personal-motivo${t.asignable ? " aviso" : ""}`}
                    >
                      {t.motivo}
                    </span>
                  )}
                </div>
                {t.asignable && (
                  <div className="personal-accion">
                    {t.roles.length > 1 && (
                      <select
                        aria-label={`Rol de ${t.nombre}`}
                        value={rolDe(t)}
                        onChange={(e) =>
                          setRolElegido((prev) => ({
                            ...prev,
                            [t.id_trabajador]: Number(e.target.value),
                          }))
                        }
                      >
                        {t.roles.map((r) => (
                          <option key={r.id_rol} value={r.id_rol}>
                            {r.nombre}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      className={`boton ${t.estado === "DISPONIBLE" ? "boton-principal" : "boton-secundario"}`}
                      disabled={asignando !== null || !rolDe(t)}
                      onClick={() => asignar(t)}
                    >
                      <UserPlus />{" "}
                      {asignando === t.id_trabajador
                        ? "Asignando…"
                        : t.estado === "SIN_DISPONIBILIDAD"
                          ? "Asignar igual"
                          : "Asignar"}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
