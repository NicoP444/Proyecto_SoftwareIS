import { useEffect, useState } from "react";
import { Package, X } from "lucide-react";
import {
  listarKitsEvento,
  listarKitsDisponibles,
  reservarKit,
  quitarKit,
} from "../../services/kitEvento.service.js";

const NIVELES = { BASICO: "Básico", ESTANDAR: "Estándar", ALTA_GAMA: "Alta gama" };

/**
 * Bloque "Kits" del detalle del evento (RF-P1-05).
 * Muestra los kits del evento y, si el usuario puede editar, deja asignar
 * un kit completo y libre en ese horario o quitarlo.
 */
export default function PanelKits({ evento, puedeEditar, onCambio }) {
  const [kits, setKits] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [abierto, setAbierto] = useState(false); // muestra el selector
  const [idElegido, setIdElegido] = useState("");
  const [error, setError] = useState("");
  const [avisos, setAvisos] = useState([]); // advertencias que devuelve el back
  const [guardando, setGuardando] = useState(false);

  const cerrado = evento.estado === "CERRADO";

  // conDisponibles: también refresca la lista del selector
  async function cargar(conDisponibles) {
    try {
      setKits(await listarKitsEvento(evento.id_evento));
      if (conDisponibles) setDisponibles(await listarKitsDisponibles(evento.id_evento));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    setAbierto(false);
    setAvisos([]);
    setError("");
    cargar(false);
  }, [evento.id_evento]);

  async function alternar() {
    const nuevo = !abierto;
    setAbierto(nuevo);
    setIdElegido("");
    setError("");
    if (nuevo) await cargar(true);
  }

  async function agregar() {
    if (!idElegido) return setError("Elige un kit");
    setError("");
    setGuardando(true);
    try {
      const respuesta = await reservarKit(evento.id_evento, Number(idElegido));
      setAvisos(respuesta.advertencias ?? []);
      setIdElegido("");
      await cargar(true);
      onCambio?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(k) {
    if (!window.confirm(`¿Quitar el kit "${k.kit.nombre}" de este evento?`)) return;
    setError("");
    setAvisos([]);
    try {
      await quitarKit(evento.id_evento, k.id_reserva);
      await cargar(abierto);
      onCambio?.();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="personal-panel">
      <div className="personal-cabecera">
        <span className="etiqueta">Kits</span>
        {puedeEditar && !cerrado && (
          <button type="button" className="boton boton-texto" onClick={alternar}>
            <Package /> {abierto ? "Cerrar" : "Asignar"}
          </button>
        )}
      </div>

      {error && <div className="mensaje mensaje-error">{error}</div>}

      {avisos.length > 0 && (
        <div className="mensaje mensaje-aviso">
          <ul>
            {avisos.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {kits.length === 0 ? (
        <p className="texto-tenue">Aún no hay kits asignados</p>
      ) : (
        <div className="lista-roles">
          {kits.map((k) => (
            <span key={k.id_reserva} className="chip-rol">
              {k.kit.nombre} · {NIVELES[k.kit.nivel] ?? k.kit.nivel}
              {puedeEditar && !cerrado && !k.salida && (
                <button
                  type="button"
                  className="chip-quitar"
                  onClick={() => quitar(k)}
                  aria-label={`Quitar el kit ${k.kit.nombre}`}
                >
                  <X />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {abierto && (
        <div className="campo">
          {disponibles.length === 0 ? (
            <p className="texto-tenue">No hay kits completos y libres en este horario</p>
          ) : (
            <>
              <label htmlFor="kit-elegido">Kits completos y libres en este horario</label>
              <select id="kit-elegido" value={idElegido} onChange={(ev) => setIdElegido(ev.target.value)}>
                <option value="">Selecciona un kit…</option>
                {disponibles.map((k) => (
                  <option key={k.id_kit} value={k.id_kit}>
                    {k.nombre} · {NIVELES[k.nivel] ?? k.nivel}
                  </option>
                ))}
              </select>
              <button type="button" className="boton boton-principal" onClick={agregar} disabled={guardando || !idElegido}>
                {guardando ? "Asignando…" : "Asignar kit"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}