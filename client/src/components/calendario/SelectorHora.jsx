const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS_BASE = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/**
 * Selector de hora en formato 24 h (HH:MM).
 * Reemplaza al input type="time", que muestra AM/PM según el idioma del navegador.
 * valor y onCambiar usan texto "HH:MM" (o "" si no hay hora elegida).
 */
export default function SelectorHora({ id, valor, onCambiar }) {
  const [h = "", m = ""] = (valor || "").split(":");

  // Minutos de 5 en 5; si el evento ya tiene otro minuto (ej: 07), se agrega para no perderlo
  const minutos = m && !MINUTOS_BASE.includes(m) ? [...MINUTOS_BASE, m].sort() : MINUTOS_BASE;

  function cambiar(nuevaH, nuevaM) {
    if (!nuevaH) return onCambiar("");
    onCambiar(`${nuevaH}:${nuevaM || "00"}`);
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <select id={id} value={h} onChange={(e) => cambiar(e.target.value, m)} aria-label="Hora" style={{ flex: 1 }}>
        <option value="">--</option>
        {HORAS.map((x) => (
          <option key={x} value={x}>{x}</option>
        ))}
      </select>
      <span>:</span>
      <select value={m} onChange={(e) => cambiar(h, e.target.value)} aria-label="Minutos" style={{ flex: 1 }}>
        <option value="">--</option>
        {minutos.map((x) => (
          <option key={x} value={x}>{x}</option>
        ))}
      </select>
    </div>
  );
}