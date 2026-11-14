import { useRef, useState } from "react";
import { Copy, MessageCircle } from "lucide-react";
import { listarAsignaciones } from "../../services/asignacion.service.js";

const DIAS_SEMANA = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

// "2026-11-12" -> "jueves 12 de noviembre de 2026"
// Se arma con partes numéricas para que no se corra el día por zona horaria
function fechaLarga(clave) {
  const [anio, mes, dia] = clave.split("-").map(Number);
  const f = new Date(anio, mes - 1, dia);
  return `${DIAS_SEMANA[f.getDay()]} ${dia} de ${MESES[mes - 1]} de ${anio}`;
}

// Arma el texto listo para WhatsApp: datos del evento + trabajadores agrupados por rol
function armarTexto(evento, asignaciones) {
  const porRol = {};
  asignaciones.forEach((a) => {
    const rol = a.rol.nombre;
    if (!porRol[rol]) porRol[rol] = [];
    porRol[rol].push(a.trabajador.nombre);
  });

  const lineasEquipo = Object.entries(porRol).map(
    ([rol, nombres]) => `• ${rol}: ${nombres.join(", ")}`,
  );

  return [
    ` Convocatoria: ${evento.tipo}`,
    ` ${fechaLarga(evento.fecha)}`,
    ` ${evento.hora_inicio} – ${evento.hora_termino}`,
    ` ${evento.direccion}`,
    "",
    "Equipo convocado:",
    ...lineasEquipo,
  ].join("\n");
}

/**
 * RF-P3-03: genera un texto con fecha, hora, dirección y los trabajadores
 * por rol, listo para copiar y pegar en WhatsApp. No envía nada por sí mismo.
 */
export default function ConvocatoriaEvento({ evento }) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const areaRef = useRef(null);

  async function generar() {
    setError("");
    setCopiado(false);
    setCargando(true);
    try {
      // Se pide la dotación al back en este momento para no usar datos viejos
      const asignaciones = await listarAsignaciones(evento.id_evento);
      if (asignaciones.length === 0) {
        setTexto("");
        setError(
          "Primero asigna personal al evento para generar la convocatoria",
        );
        return;
      }
      setTexto(armarTexto(evento, asignaciones));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Si el navegador no deja usar el portapapeles, seleccionamos y copiamos a la antigua
      areaRef.current?.select();
      document.execCommand("copy");
    }
    setCopiado(true);
  }

  return (
    <div>
      <span className="etiqueta">Convocatoria</span>

      <button
        type="button"
        className="boton boton-secundario"
        onClick={generar}
        disabled={cargando}
      >
        <MessageCircle size={16} />{" "}
        {cargando ? "Generando..." : "Generar convocatoria"}
      </button>

      {error && <div className="mensaje mensaje-aviso">{error}</div>}

      {texto && (
        <>
          <textarea
            ref={areaRef}
            value={texto}
            onChange={(ev) => {
              setTexto(ev.target.value);
              setCopiado(false);
            }}
            rows={9}
            style={{ width: "100%", marginTop: 8 }}
          />
          <button
            type="button"
            className="boton boton-secundario"
            onClick={copiar}
          >
            <Copy size={16} /> Copiar texto
          </button>
          {copiado && (
            <p className="texto-tenue">
              Texto copiado. Ya puedes pegarlo en WhatsApp.
            </p>
          )}
        </>
      )}
    </div>
  );
}
