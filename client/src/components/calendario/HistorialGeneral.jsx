import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { listarHistorialGeneral } from "../../services/evento.service.js";
import { TablaHistorial } from "./HistorialEvento";

/**
 * Historial de todos los eventos del Dueño, incluidos los eliminados (RF-P1-08).
 * Se puede filtrar por número de evento para rastrear uno que ya no está en el calendario.
 */
export default function HistorialGeneral() {
  const [numero, setNumero] = useState(""); // lo que se escribe
  const [filtro, setFiltro] = useState(""); // lo que se buscó
  const [cambios, setCambios] = useState(null);
  const [error, setError] = useState("");

  async function cargar(valor = "") {
    setError("");
    setCambios(null);
    setFiltro(valor);
    try {
      setCambios(await listarHistorialGeneral(valor));
    } catch (err) {
      setError(err.message);
      setCambios([]);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function buscar(ev) {
    ev.preventDefault();
    cargar(numero.trim());
  }

  function limpiar() {
    setNumero("");
    cargar();
  }

  return (
    <div className="hist-panel">
      <form className="hist-barra" onSubmit={buscar}>
        <div className="campo campo-busqueda">
          <label htmlFor="hist-numero">N° de evento</label>
          <Search />
          <input
            id="hist-numero"
            type="number"
            min="1"
            placeholder="Ej: 300"
            value={numero}
            onChange={(ev) => setNumero(ev.target.value)}
            autoComplete="off"
          />
        </div>
        <button type="submit" className="boton boton-principal">
          Buscar
        </button>
        {filtro && (
          <button type="button" className="boton boton-secundario" onClick={limpiar}>
            Ver todos
          </button>
        )}
      </form>

      {error && <div className="mensaje mensaje-error">{error}</div>}

      {!cambios ? (
        <p className="vacio">Cargando historial…</p>
      ) : (
        <>
          <p className="hist-resumen">
            {filtro
              ? `${cambios.length} cambio(s) del evento #${filtro}, incluido si fue eliminado`
              : `Últimos ${cambios.length} cambio(s) de todos los eventos`}
          </p>
          <TablaHistorial cambios={cambios} mostrarEvento />
        </>
      )}
    </div>
  );
}