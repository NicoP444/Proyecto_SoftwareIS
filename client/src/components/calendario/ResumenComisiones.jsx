import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const plata = (n) => "$" + Number(n).toLocaleString("es-CL");

// Cómo se ve cada nivel que calcula el back (utils/comisionEvento.js)
const NIVELES = {
  OK: { clase: "", Icono: CheckCircle2, titulo: "Comisiones dentro de lo recomendado" },
  ALTO: { clase: "alto", Icono: AlertTriangle, titulo: "Comisiones sobre lo recomendado" },
  SIN_UTILIDAD: { clase: "sin-utilidad", Icono: XCircle, titulo: "El dueño queda sin utilidad" },
};

/**
 * Tarjeta con el total de comisiones del personal del evento y lo que le queda al dueño.
 * Solo informa: la asignación no se bloquea, la decisión final es del dueño.
 * resumen: lo que devuelve GET /eventos/:id/comisiones
 */
export default function ResumenComisiones({ resumen }) {
  if (!resumen) return null;

  const nivel = NIVELES[resumen.nivel] ?? NIVELES.OK;
  const { Icono } = nivel;
  const ancho = Math.min(resumen.total_porcentaje, 100);

  return (
    <div className={`comision-tarjeta ${nivel.clase}`}>
      <div className="comision-cabecera">
        <span>
          <Icono /> {nivel.titulo}
        </span>
        <strong>{resumen.total_porcentaje}%</strong>
      </div>

      {/* Barra: comisión total, con una marca en el tope recomendado */}
      <div
        className="comision-barra"
        role="img"
        aria-label={`Comisiones: ${resumen.total_porcentaje}% de un ${resumen.tope_recomendado}% recomendado`}
      >
        <div className="comision-relleno" style={{ width: `${ancho}%` }} />
        <div
          className="comision-marca"
          style={{ left: `${resumen.tope_recomendado}%` }}
        />
      </div>

      <p className="texto-tenue">
        Personal {resumen.total_porcentaje}% · Dueño{" "}
        {resumen.queda_dueno_porcentaje}% ({plata(resumen.queda_dueno_monto)})
        · Recomendado: hasta {resumen.tope_recomendado}% para el personal.
      </p>
      {resumen.sin_porcentaje > 0 && (
        <p className="texto-tenue">
          {resumen.sin_porcentaje === 1
            ? "1 asignación no tiene porcentaje (su rol no tiene porcentaje referencial) y cuenta como 0%."
            : `${resumen.sin_porcentaje} asignaciones no tienen porcentaje (su rol no tiene porcentaje referencial) y cuentan como 0%.`}
        </p>
      )}
    </div>
  );
}