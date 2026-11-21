import { useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import BuscadorPersonal from "./BuscadorPersonal";
import ResumenComisiones from "./ResumenComisiones";
import {
  listarAsignaciones,
  quitarAsignacion,
  verComisiones,
} from "../../services/asignacion.service.js";

/**
 * Bloque "Trabajadores" del detalle del evento (RF-P3-01).
 * Muestra la dotación del evento y, si el usuario puede editar, deja
 * asignar más personal o quitar a alguien.
 * Al Dueño también le muestra el total de comisiones del evento y lo que le
 * queda a él (solo aviso, no bloquea la asignación).
 */
export default function PanelPersonal({ evento, puedeEditar, onCambio }) {
  const [asignaciones, setAsignaciones] = useState([]);
  const [abierto, setAbierto] = useState(false); // muestra el buscador
  const [error, setError] = useState("");
  const [confirmando, setConfirmando] = useState(null); // id de la asignación que se está por quitar
  const [refresco, setRefresco] = useState(0); // sube al quitar a alguien: el buscador vuelve a consultar
  const [comisiones, setComisiones] = useState(null); // resumen de comisiones (solo Dueño)

  const cerrado = evento.estado === "CERRADO";

  async function cargar() {
    try {
      setAsignaciones(await listarAsignaciones(evento.id_evento));
    } catch (err) {
      setError(err.message);
    }
    // Las comisiones son un dato financiero: solo las consulta quien puede editar (Dueño)
    if (puedeEditar) {
      try {
        setComisiones(await verComisiones(evento.id_evento));
      } catch {
        setComisiones(null); // si falla, no se muestra la tarjeta (no impide trabajar)
      }
    }
  }

  useEffect(() => {
    cargar();
  }, [evento.id_evento, puedeEditar]);

  // Después de asignar o quitar: refresca este bloque y el calendario de fondo
  function alCambiar() {
    cargar();
    onCambio?.();
  }

  async function quitar(a) {
    setError("");
    setConfirmando(null);
    try {
      await quitarAsignacion(evento.id_evento, a.id_asignacion);
      setRefresco((r) => r + 1); // así vuelve a aparecer en la lista para asignar
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
          <button
            type="button"
            className="boton boton-texto"
            onClick={() => setAbierto((v) => !v)}
          >
            <UserPlus /> {abierto ? "Cerrar" : "Asignar"}
          </button>
        )}
      </div>

      {error && <div className="mensaje mensaje-error">{error}</div>}

      {puedeEditar && asignaciones.length > 0 && (
        <ResumenComisiones resumen={comisiones} />
      )}

      {asignaciones.length === 0 ? (
        <p className="texto-tenue">Aún no hay trabajadores asignados</p>
      ) : (
        <div className="lista-roles">
          {asignaciones.map((a) =>
            confirmando === a.id_asignacion ? (
              // Confirmación en la misma fila (como en Clientes), en vez de la ventana del navegador
              <span key={a.id_asignacion} className="chip-confirmar">
                ¿Quitar a {a.trabajador.nombre}?
                <button
                  type="button"
                  className="boton boton-peligro"
                  onClick={() => quitar(a)}
                >
                  Quitar
                </button>
                <button
                  type="button"
                  className="boton boton-secundario"
                  onClick={() => setConfirmando(null)}
                >
                  Cancelar
                </button>
              </span>
            ) : (
              <span key={a.id_asignacion} className="chip-rol">
                {a.trabajador.nombre} · {a.rol.nombre}
                {puedeEditar && !cerrado && (
                  <button
                    type="button"
                    className="chip-quitar"
                    onClick={() => setConfirmando(a.id_asignacion)}
                    aria-label={`Quitar a ${a.trabajador.nombre}`}
                  >
                    <X />
                  </button>
                )}
              </span>
            ),
          )}
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
          refresco={refresco}
          comisiones={comisiones}
        />
      )}
    </div>
  );
}