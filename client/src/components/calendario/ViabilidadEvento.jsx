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
  const color = positivo ? "#1a7f37" : "#c0392b";
  const cambioPendiente = String(datos.gastos_estimados) !== String(gastos);

  return (
    <div>
      <span className="etiqueta">Viabilidad económica (estimada)</span>

      <p className="texto-pequeno">
        Precio acordado: {plata(datos.precio_acordado)}
      </p>
      <p className="texto-pequeno">
        + Aportes comprometidos: {plata(datos.aportes_comprometidos)}
      </p>
      <p className="texto-pequeno">
        − Remuneraciones estimadas: {plata(datos.remuneraciones_estimadas)}
      </p>

      <p className="texto-pequeno">
        − Gastos estimados:{" "}
        {puedeEditar ? (
          <>
            <input
              type="number"
              min="0"
              value={gastos}
              onChange={(ev) => setGastos(ev.target.value)}
              style={{ width: 120 }}
            />{" "}
            <button
              type="button"
              className="boton boton-secundario"
              onClick={guardar}
              disabled={guardando || !cambioPendiente}
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </>
        ) : (
          plata(datos.gastos_estimados)
        )}
      </p>

      <p style={{ color, fontWeight: 600 }}>
        <Icono size={16} /> Resultado estimado: {plata(datos.resultado)} (
        {positivo ? "positivo" : "negativo"})
      </p>

      {error && <div className="mensaje mensaje-error">{error}</div>}
    </div>
  );
}
