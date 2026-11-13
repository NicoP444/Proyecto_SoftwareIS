import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarEventosConfirmados } from "../../services/marcarEvento.service.js";
import BotonMarcarRealizado from "./BotonMarcarRealizado.jsx";

export default function EventosPendientesCierre() {
  const navigate = useNavigate();
  const [eventosConfirmados, setEventosConfirmados] = useState([]);
  const [cargandoConfirmados, setCargandoConfirmados] = useState(true);

  const cargarEventosConfirmados = () => {
    setCargandoConfirmados(true);
    listarEventosConfirmados()
      .then((res) => {
        const lista = res?.data || res || [];
        // Se cortan a 3 elementos únicamente para la tarjeta compacta del Home
        setEventosConfirmados(lista.slice(0, 3));
      })
      .catch((err) => console.error("Error al cargar eventos:", err))
      .finally(() => setCargandoConfirmados(false));
  };

  useEffect(() => {
    cargarEventosConfirmados();
  }, []);

  return (
    <section className="panel" style={{ marginTop: "1.5rem" }}>
      <div className="panel-head">
        <h3>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
          Eventos Pendientes de Cierre
        </h3>
        <button
          className="panel-link"
          onClick={() => navigate("/marcar-evento")}
        >
          Ver todos →
        </button>
      </div>

      {cargandoConfirmados ? (
        <div style={{ padding: "1rem", color: "#6b7280" }}>Cargando eventos...</div>
      ) : eventosConfirmados.length === 0 ? (
        <div className="empty">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          No hay eventos confirmados pendientes de cierre
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "0.5rem" }}>
          {eventosConfirmados.map((ev) => (
            <div
              key={ev.id_evento}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.9rem 1.2rem",
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <strong style={{ color: "#111827", fontSize: "0.95rem" }}>
                    #{ev.id_evento} {ev.tipo}
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                    {new Date(ev.fecha).toLocaleDateString("es-CL", { timeZone: "UTC" })}
                  </span>
                </div>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#4b5563" }}>
                  Cliente: {ev.cliente?.nombre || "General"} | Término:{" "}
                  {new Date(ev.hora_termino).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <BotonMarcarRealizado
                evento={ev}
                onEventoActualizado={cargarEventosConfirmados}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}