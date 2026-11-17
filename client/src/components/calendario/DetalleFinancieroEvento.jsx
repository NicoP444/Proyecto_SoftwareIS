import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { verRentabilidad, verMovimientos } from "../../services/rentabilidad.service.js";

const plata = (n) => "$" + Number(n ?? 0).toLocaleString("es-CL");

// "2026-11-10T00:00:00.000Z" -> "10-11-2026"
const fechaCorta = (f) => String(f).slice(0, 10).split("-").reverse().join("-");

/**
 * RF-P1-12: gastos, remuneraciones y resultado del evento dentro del detalle.
 * Solo se muestra a Dueño y Contador (el Calendario no lo dibuja para el Jefe técnico).
 */
export default function DetalleFinancieroEvento({ idEvento, version }) {
  const [rentabilidad, setRentabilidad] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [error, setError] = useState("");

  // Se vuelve a pedir al cambiar de evento o cuando "version" sube (pago nuevo, evento modificado)
  useEffect(() => {
    let vigente = true; // evita pintar datos de un evento que ya no está abierto
    setError("");
    Promise.all([verRentabilidad(idEvento), verMovimientos(idEvento)])
      .then(([r, m]) => {
        if (!vigente) return;
        setRentabilidad(r);
        setMovimientos(m.movimientos);
      })
      .catch((err) => vigente && setError(err.message));
    return () => {
      vigente = false;
    };
  }, [idEvento, version]);

  if (!rentabilidad) {
    return error ? <div className="mensaje mensaje-error">{error}</div> : null;
  }

  const remuneraciones = movimientos.filter((m) => m.concepto === "Remuneración");
  const gastos = movimientos.filter((m) => m.concepto === "Gasto del evento");
  const ganancia = rentabilidad.tipo === "GANANCIA";
  const Icono = ganancia ? TrendingUp : TrendingDown;

  return (
    <div>
      <span className="etiqueta">Remuneraciones</span>
      {remuneraciones.length === 0 ? (
        <p className="texto-tenue">Aún no hay remuneraciones calculadas</p>
      ) : (
        <dl className="viab-lista">
          {remuneraciones.map((m, i) => (
            <div key={i} className="viab-fila">
              <dt>{m.detalle}</dt>
              <dd>{plata(m.monto)}</dd>
            </div>
          ))}
          <div className="viab-fila">
            <dt>Total remuneraciones</dt>
            <dd>{plata(rentabilidad.remuneraciones)}</dd>
          </div>
        </dl>
      )}

      <span className="etiqueta">Gastos</span>
      {gastos.length === 0 ? (
        <p className="texto-tenue">Sin gastos registrados</p>
      ) : (
        <dl className="viab-lista">
          {gastos.map((m, i) => (
            <div key={i} className="viab-fila">
              <dt>
                {m.detalle} · {fechaCorta(m.fecha)}
              </dt>
              <dd>{plata(m.monto)}</dd>
            </div>
          ))}
          <div className="viab-fila">
            <dt>Total gastos</dt>
            <dd>{plata(rentabilidad.gastos)}</dd>
          </div>
        </dl>
      )}

      <div className={`viab-resultado ${ganancia ? "positivo" : "negativo"}`}>
        <span>
          <Icono size={18} />
          {rentabilidad.definitiva ? "Resultado final" : "Resultado a la fecha"} ·{" "}
          {ganancia ? "ganancia" : "pérdida"}
        </span>
        <strong>{plata(rentabilidad.resultado)}</strong>
      </div>

      {error && <div className="mensaje mensaje-error">{error}</div>}
    </div>
  );
}