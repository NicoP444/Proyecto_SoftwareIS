import { useEffect, useState } from "react";
import { Phone, UserPlus } from "lucide-react";
import { listarRoles } from "../../services/personalServicio.js";
import {
  listarPersonalDisponible,
  asignarTrabajador,
} from "../../services/asignacion.service.js";

/**
 * Consulta de personal disponible (RF-P1-03) y asignación al evento (RF-P3-01).
 *  - Sin "evento": el Dueño elige fecha y horario y solo mira quién está libre.
 *  - Con "evento": la fecha y el horario son los del evento y cada trabajador
 *    tiene un botón para asignarlo con uno de sus roles.
 */
export default function BuscadorPersonal({ evento, onAsignado }) {
  const [fecha, setFecha] = useState(evento?.fecha ?? "");
  const [horaInicio, setHoraInicio] = useState(evento?.hora_inicio ?? "");
  const [horaTermino, setHoraTermino] = useState(evento?.hora_termino ?? "");
  const [idRol, setIdRol] = useState("");
  const [roles, setRoles] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [rolElegido, setRolElegido] = useState({}); // id_trabajador -> id_rol
  const [cargando, setCargando] = useState(false);
  const [asignando, setAsignando] = useState(null); // id del trabajador que se está asignando
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState(null); // { advertencia, textos }
  const [version, setVersion] = useState(0); // sube para volver a buscar

  const franjaValida = Boolean(fecha && horaInicio && horaTermino && horaTermino > horaInicio);

  // Roles para el filtro (solo los activos)
  useEffect(() => {
    listarRoles()
      .then((lista) => setRoles(lista.filter((r) => r.estado === "ACTIVO")))
      .catch(() => setRoles([]));
  }, []);

  // Cada vez que cambia la franja, el rol o se asigna a alguien, se vuelve a consultar
  useEffect(() => {
    if (!franjaValida) {
      setDisponibles([]);
      return;
    }
    let vigente = true;
    setCargando(true);
    listarPersonalDisponible({
      fecha,
      hora_inicio: horaInicio,
      hora_termino: horaTermino,
      id_rol: idRol,
      id_evento: evento?.id_evento,
    })
      .then((lista) => {
        if (!vigente) return;
        setDisponibles(lista);
        setError("");
      })
      .catch((err) => vigente && setError(err.message))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [fecha, horaInicio, horaTermino, idRol, version, franjaValida, evento?.id_evento]);

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
      const res = await asignarTrabajador(evento.id_evento, t.id_trabajador, rolDe(t));
      setAviso(
        res.advertencias?.length
          ? { advertencia: true, textos: res.advertencias }
          : { advertencia: false, textos: [`${t.nombre} fue asignado al evento`] },
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
        {!evento && (
          <>
            <div className="campo">
              <label htmlFor="pd-fecha">Fecha</label>
              <input id="pd-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="pd-inicio">Desde</label>
              <input id="pd-inicio" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="pd-termino">Hasta</label>
              <input id="pd-termino" type="time" value={horaTermino} onChange={(e) => setHoraTermino(e.target.value)} />
            </div>
          </>
        )}
        <div className="campo">
          <label htmlFor="pd-rol">Filtrar por rol</label>
          <select id="pd-rol" value={idRol} onChange={(e) => setIdRol(e.target.value)}>
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
        <div className={`mensaje ${aviso.advertencia ? "mensaje-aviso" : "mensaje-exito"}`}>
          {aviso.advertencia && <strong>Asignado, pero revisa: </strong>}
          {aviso.textos.join(". ")}
        </div>
      )}

      {!franjaValida && (
        <p className="texto-tenue">
          Elige la fecha y un horario válido para ver quién está disponible.
        </p>
      )}
      {franjaValida && cargando && disponibles.length === 0 && <p className="texto-tenue">Buscando…</p>}
      {franjaValida && !cargando && disponibles.length === 0 && !error && (
        <p className="texto-tenue">Nadie está disponible en ese horario.</p>
      )}

      {disponibles.length > 0 && (
        <>
          <p className="texto-tenue">
            {disponibles.length} {disponibles.length === 1 ? "persona disponible" : "personas disponibles"}
          </p>
          <ul className="personal-lista">
            {disponibles.map((t) => (
              <li key={t.id_trabajador} className="personal-fila">
                <div className="personal-datos">
                  <strong>{t.nombre}</strong>
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
                </div>
                {evento && (
                  <div className="personal-accion">
                    {t.roles.length > 1 && (
                      <select
                        aria-label={`Rol de ${t.nombre}`}
                        value={rolDe(t)}
                        onChange={(e) =>
                          setRolElegido((prev) => ({ ...prev, [t.id_trabajador]: Number(e.target.value) }))
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
                      className="boton boton-principal"
                      disabled={asignando !== null || !rolDe(t)}
                      onClick={() => asignar(t)}
                    >
                      <UserPlus /> {asignando === t.id_trabajador ? "Asignando…" : "Asignar"}
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