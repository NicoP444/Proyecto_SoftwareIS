import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { obtenerMargenTraslado, guardarMargenTraslado } from "../../services/configuracion.service.js";

const ATAJOS = [0, 30, 60, 90, 120];

/**
 * Configuración del margen de traslado (RF-P3-02): tiempo mínimo, de 0 a 300
 * minutos, que debe haber entre dos eventos en lugares distintos para una
 * misma persona. Se usa al asignar personal a un evento.
 */
export default function MargenTraslado({ onGuardado }) {
  const [guardado, setGuardado] = useState(null); // valor que hay en el sistema
  const [minutos, setMinutos] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    obtenerMargenTraslado()
      .then(({ margen_traslado_min }) => {
        setGuardado(margen_traslado_min);
        setMinutos(String(margen_traslado_min));
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  const valor = Number(minutos);
  const valido = minutos !== "" && Number.isInteger(valor) && valor >= 0 && valor <= 300;
  const hayCambio = valido && valor !== guardado;

  function cambiar(nuevo) {
    setMinutos(String(nuevo));
    setOk("");
    setError("");
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    setOk("");
    try {
      const res = await guardarMargenTraslado(valor);
      setGuardado(res.margen_traslado_min);
      setOk("Margen de traslado actualizado");
      onGuardado?.(res.margen_traslado_min);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p className="texto-tenue">Cargando…</p>;

  return (
    <form className="formulario margen-form" onSubmit={guardar} noValidate>
      <p className="texto-tenue">
        Tiempo mínimo que debe haber entre dos eventos en lugares distintos para una misma persona.
        Si no alcanza, el sistema avisa al asignarla.
      </p>

      {error && <div className="mensaje mensaje-error">{error}</div>}
      {ok && <div className="mensaje mensaje-exito">{ok}</div>}

      <div className="margen-control">
        <input
          type="range"
          min="0"
          max="300"
          step="5"
          value={valido ? valor : 0}
          onChange={(e) => cambiar(e.target.value)}
          aria-label="Margen de traslado en minutos"
        />
        <div className="campo margen-numero">
          <label htmlFor="margen-min">Minutos</label>
          <input
            id="margen-min"
            type="number"
            min="0"
            max="300"
            value={minutos}
            onChange={(e) => cambiar(e.target.value)}
          />
        </div>
      </div>

      <div className="margen-atajos">
        {ATAJOS.map((m) => (
          <button
            key={m}
            type="button"
            className={valor === m ? "activo" : ""}
            onClick={() => cambiar(m)}
          >
            {m === 0 ? "Sin margen" : `${m} min`}
          </button>
        ))}
      </div>

      {minutos !== "" && !valido && (
        <p className="campo-error">Ingresa un número entero entre 0 y 300.</p>
      )}

      <div className="margen-acciones">
        <button type="submit" className="boton boton-principal" disabled={!hayCambio || guardando}>
          <Save /> {guardando ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}