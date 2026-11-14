import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import {
  verViabilidad,
  guardarGastosEstimados,
} from "../../services/viabilidad.service.js";

const plata = (n) => "$" + Number(n).toLocaleString("es-CL");

/**
 * RF-P1-06: resultado estimado del evento (precio + aportes - remuneraciones - gastos).
 * Solo se muestra a Dueño y Contador; solo el Dueño puede cambiar los gastos estimados.
 */
export default function ViabilidadEvento({ idEvento, puedeEditar }) {
  const [datos, setDatos] = useState(null);
  const [gastos, setGastos] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setError("");
    try {
      const respuesta = await verViabilidad(idEvento);
      setDatos(respuesta);
      setGastos(String(respuesta.gastos_estimados));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    cargar();
  }, [idEvento]);

  async function guardar() {
    setError("");
    setGuardando(true);
    try {
      const respuesta = await guardarGastosEstimados(idEvento, Number(gastos));
      setDatos(respuesta);
      setGastos(String(respuesta.gastos_estimados));
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (!datos) {
    return error ? <div className="mensaje mensaje-error">{error}</div> : null;
  }

  const positivo = datos.tipo === "POSITIVO";
  const Icono = positivo ? TrendingUp : TrendingDown;
  const cambioPendiente = String(datos.gastos_estimados) !== String(gastos);

  return (
    <div>
      <span className="etiqueta">Viabilidad económica (estimada)</span>

      <dl className="viab-lista">
        <div className="viab-fila">
          <dt>Precio acordado</dt>
          <dd>{plata(datos.precio_acordado)}</dd>
        </div>
        <div className="viab-fila">
          <dt>+ Aportes comprometidos</dt>
          <dd>{plata(datos.aportes_comprometidos)}</dd>
        </div>
        <div className="viab-fila">
          <dt>− Remuneraciones estimadas</dt>
          <dd>{plata(datos.remuneraciones_estimadas)}</dd>
        </div>
        <div className="viab-fila">
          <dt>− Gastos estimados</dt>
          <dd>
            {puedeEditar ? (
              <span className="viab-gastos">
                <input
                  type="number"
                  min="0"
                  value={gastos}
                  onChange={(ev) => setGastos(ev.target.value)}
                />
                <button
                  type="button"
                  className="boton boton-secundario"
                  onClick={guardar}
                  disabled={guardando || !cambioPendiente}
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </span>
            ) : (
              plata(datos.gastos_estimados)
            )}
          </dd>
        </div>
      </dl>

      <div className={`viab-resultado ${positivo ? "positivo" : "negativo"}`}>
        <span>
          <Icono size={18} /> Resultado {positivo ? "positivo" : "negativo"}
        </span>
        <strong>{plata(datos.resultado)}</strong>
      </div>

      {error && <div className="mensaje mensaje-error">{error}</div>}
    </div>
  );
}
