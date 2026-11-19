import { useEffect, useState } from "react";
import { Package, PackagePlus, X } from "lucide-react";
import {
  listarKitsEvento,
  listarKitsDisponibles,
  reservarKit,
  quitarKit,
} from "../../services/kitEvento.service.js";

const NIVELES = { BASICO: "Básico", ESTANDAR: "Estándar", ALTA_GAMA: "Alta gama" };

// Igual que en el personal: color por estado y si se puede asignar (mismas reglas del back)
//  - Disponible: se asigna sin avisos.
//  - En terreno: se permite, pero el back avisa que aún no registra su retorno.
//  - Ocupado o incompleto: el back lo rechaza, así que se muestra bloqueado.
const ESTADOS = {
  DISPONIBLE: { texto: "Disponible", color: "var(--verde)", orden: 0 },
  EN_TERRENO: { texto: "En terreno", color: "var(--naranjo)", orden: 1 },
  OCUPADO: { texto: "Ocupado", color: "var(--rojo)", orden: 2 },
  INCOMPLETO: { texto: "Incompleto", color: "var(--texto-tenue)", orden: 3 },
};

/**
 * Bloque "Kits" del detalle del evento (RF-P1-05).
 * Muestra los kits del evento y, si el usuario puede editar, lista TODOS los kits con su
 * estado para el horario del evento y un botón para asignarlos. Los que no se pueden
 * asignar aparecen bloqueados y con el motivo, igual que en la asignación de personal.
 */
export default function PanelKits({ evento, puedeEditar, onCambio }) {
  const [kits, setKits] = useState([]);
  const [opciones, setOpciones] = useState([]);
  const [abierto, setAbierto] = useState(false); // muestra la lista para asignar
  const [cargando, setCargando] = useState(false);
  const [asignando, setAsignando] = useState(null); // id del kit que se está asignando
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState(null); // { advertencia, textos }
  const [confirmando, setConfirmando] = useState(null); // id de la reserva que se está por quitar

  const cerrado = evento.estado === "CERRADO";

  // conOpciones: también refresca la lista de kits para asignar
  async function cargar(conOpciones) {
    try {
      setKits(await listarKitsEvento(evento.id_evento));
      if (conOpciones) {
        setCargando(true);
        setOpciones(await listarKitsDisponibles(evento.id_evento));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    setAbierto(false);
    setAviso(null);
    setError("");
    cargar(false);
  }, [evento.id_evento]);

  async function alternar() {
    const nuevo = !abierto;
    setAbierto(nuevo);
    setError("");
    setAviso(null);
    if (nuevo) await cargar(true);
  }

  async function asignar(k) {
    setAsignando(k.id_kit);
    setError("");
    setAviso(null);
    try {
      const respuesta = await reservarKit(evento.id_evento, k.id_kit);
      setAviso(
        respuesta.advertencias?.length
          ? { advertencia: true, textos: respuesta.advertencias }
          : { advertencia: false, textos: [`${k.nombre} fue asignado al evento`] },
      );
      await cargar(true);
      onCambio?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setAsignando(null);
    }
  }

  async function quitar(k) {
    setError("");
    setConfirmando(null);
    setAviso(null);
    try {
      await quitarKit(evento.id_evento, k.id_reserva);
      await cargar(abierto);
      onCambio?.();
    } catch (err) {
      setError(err.message);
    }
  }

  // Primero los que se pueden asignar
  const filas = opciones
    .map((k) => ({ ...k, info: ESTADOS[k.estado_franja] ?? ESTADOS.DISPONIBLE }))
    .sort((a, b) => a.info.orden - b.info.orden || a.nombre.localeCompare(b.nombre, "es"));
  const libres = filas.filter((k) => k.estado_franja === "DISPONIBLE").length;

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

      {kits.length === 0 ? (
        <p className="texto-tenue">Aún no hay kits asignados</p>
      ) : (
        <div className="lista-roles">
          {kits.map((k) =>
            confirmando === k.id_reserva ? (
              // Confirmación en la misma fila (como en Clientes), en vez de la ventana del navegador
              <span key={k.id_reserva} className="chip-confirmar">
                ¿Quitar {k.kit.nombre}?
                <button type="button" className="boton boton-peligro" onClick={() => quitar(k)}>
                  Quitar
                </button>
                <button type="button" className="boton boton-secundario" onClick={() => setConfirmando(null)}>
                  Cancelar
                </button>
              </span>
            ) : (
              <span key={k.id_reserva} className="chip-rol">
                {k.kit.nombre} · {NIVELES[k.kit.nivel] ?? k.kit.nivel}
                {puedeEditar && !cerrado && !k.salida && (
                  <button
                    type="button"
                    className="chip-quitar"
                    onClick={() => setConfirmando(k.id_reserva)}
                    aria-label={`Quitar el kit ${k.kit.nombre}`}
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
        <div className="personal-buscador">
          {error && <div className="mensaje mensaje-error">{error}</div>}
          {aviso && (
            <div className={`mensaje ${aviso.advertencia ? "mensaje-aviso" : "mensaje-exito"}`}>
              {aviso.advertencia && <strong>Asignado, pero revisa: </strong>}
              {aviso.textos.join(". ")}
            </div>
          )}

          {cargando && filas.length === 0 && <p className="texto-tenue">Buscando…</p>}
          {!cargando && filas.length === 0 && !error && (
            <p className="texto-tenue">Todos los kits ya están en este evento.</p>
          )}

          {filas.length > 0 && (
            <>
              <p className="texto-tenue">
                {libres} {libres === 1 ? "kit disponible" : "kits disponibles"} de {filas.length}. Los bloqueados
                muestran el motivo.
              </p>
              <ul className="personal-lista">
                {filas.map((k) => (
                  <li key={k.id_kit} className={`personal-fila${k.disponible ? "" : " personal-bloqueado"}`}>
                    <div className="personal-datos">
                      <div className="personal-nombre">
                        <strong>{k.nombre}</strong>
                        <span className="chip-cal" style={{ "--color": k.info.color }}>
                          {k.info.texto}
                        </span>
                      </div>
                      <span className="texto-pequeno">{NIVELES[k.nivel] ?? k.nivel}</span>
                      {k.equipos?.length > 0 && (
                        <div className="lista-roles">
                          {k.equipos.map((e) => (
                            <span
                              key={e.codigo}
                              className={`chip-rol${e.estado === "OPERATIVO" ? "" : " chip-equipo-malo"}`}
                              title={e.estado === "OPERATIVO" ? undefined : `Estado: ${e.estado}`}
                            >
                              {e.codigo}
                            </span>
                          ))}
                        </div>
                      )}
                      {k.motivo && (
                        <span className={`personal-motivo${k.disponible ? " aviso" : ""}`}>{k.motivo}</span>
                      )}
                    </div>
                    {k.disponible && (
                      <div className="personal-accion">
                        <button
                          type="button"
                          className={`boton ${k.estado_franja === "DISPONIBLE" ? "boton-principal" : "boton-secundario"}`}
                          disabled={asignando !== null}
                          onClick={() => asignar(k)}
                        >
                          <PackagePlus />{" "}
                          {asignando === k.id_kit
                            ? "Asignando…"
                            : k.estado_franja === "EN_TERRENO"
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
      )}

      {!abierto && error && <div className="mensaje mensaje-error">{error}</div>}
    </div>
  );
}