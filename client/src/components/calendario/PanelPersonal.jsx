import { useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import BuscadorPersonal from "./BuscadorPersonal";
import { listarAsignaciones, quitarAsignacion } from "../../services/asignacion.service.js";

/**
 * Bloque "Trabajadores" del detalle del evento (RF-P3-01).
 * Muestra la dotación del evento y, si el usuario puede editar, deja
 * asignar más personal o quitar a alguien.
 */
export default function PanelPersonal({ evento, puedeEditar, onCambio }) {
  const [asignaciones, setAsignaciones] = useState([]);
  const [abierto, setAbierto] = useState(false); // muestra el buscador
  const [error, setError] = useState("");

  const cerrado = evento.estado === "CERRADO";

  async function cargar() {
    try {
      setAsignaciones(await listarAsignaciones(evento.id_evento));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    cargar();
  }, [evento.id_evento]);

  // Después de asignar o quitar: refresca este bloque y el calendario de fondo
  function alCambiar() {
    cargar();
    onCambio?.();
  }

  async function quitar(a) {
    if (!window.confirm(`¿Quitar a ${a.trabajador.nombre} de este evento?`)) return;
    setError("");
    try {
      await quitarAsignacion(evento.id_evento, a.id_asignacion);
      alCambiar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="personal-panel">
      <div className="personal-cabecera">
        <span className="etiqueta">Trabajadores</span>
        {puedeEditar && !cerrado && (
          <button type="button" className="boton boton-texto" onClick={() => setAbierto((v) => !v)}>
            <UserPlus /> {abierto ? "Cerrar" : "Asignar"}
          </button>
        )}
      </div>

      {error && <div className="mensaje mensaje-error">{error}</div>}

      {asignaciones.length === 0 ? (
        <p className="texto-tenue">Aún no hay trabajadores asignados</p>
      ) : (
        <div className="lista-roles">
          {asignaciones.map((a) => (
            <span key={a.id_asignacion} className="chip-rol">
              {a.trabajador.nombre} · {a.rol.nombre}
              {puedeEditar && !cerrado && (
                <button
                  type="button"
                  className="chip-quitar"
                  onClick={() => quitar(a)}
                  aria-label={`Quitar a ${a.trabajador.nombre}`}
                >
                  <X />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {abierto && (
        <BuscadorPersonal
          evento={{
            id_evento: evento.id_evento,
            fecha: evento.fecha,
            hora_inicio: evento.hora_inicio,
            hora_termino: evento.hora_termino,
          }}
          onAsignado={alCambiar}
        />
      )}
    </div>
  );
}