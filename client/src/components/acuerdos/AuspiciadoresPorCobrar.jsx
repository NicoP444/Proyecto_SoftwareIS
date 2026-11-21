import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerAcuerdos } from "../../services/acuerdoService";
import "../../styles/Acuerdos.css";

const Icono = ({ children }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const ICONOS = {
  auspiciadores: (
    <path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.4 6.7 19.1l1-5.8L3.5 9.2l5.9-.9z" />
  ),
};

const EstadoVacio = ({ texto }) => (
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
    {texto}
  </div>
);

export default function AuspiciadoresPorCobrar() {
  const navigate = useNavigate();
  const [cobrosPendientes, setCobrosPendientes] = useState([]);
  const [cargandoCobros, setCargandoCobros] = useState(true);

  useEffect(() => {
    const cargarCobros = async () => {
      try {
        setCargandoCobros(true);
        const data = await obtenerAcuerdos();

        const pendientes = Array.isArray(data)
          ? data.filter((item) => ["PENDIENTE", "PARCIAL", "VENCIDO"].includes(item.estado))
          : [];

        setCobrosPendientes(pendientes);
      } catch (error) {
        console.warn("Error al cargar auspiciadores por cobrar:", error.message);
        setCobrosPendientes([]);
      } finally {
        setCargandoCobros(false);
      }
    };

    cargarCobros();
  }, []);

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>
          <Icono>{ICONOS.auspiciadores}</Icono>
          Auspiciadores por cobrar
        </h3>
        <button
          className="panel-link"
          onClick={() => navigate("/auspiciadores")}
        >
          Ver todos →
        </button>
      </div>

      {cargandoCobros ? (
        <p className="acuerdos-cargando">Cargando cobros...</p>
      ) : cobrosPendientes.length === 0 ? (
        <EstadoVacio texto="No hay cobros pendientes" />
      ) : (
        <div className="acuerdos-lista">
          {cobrosPendientes.map((acuerdo) => {
            const nombreAuspiciador = acuerdo.auspiciador?.nombre || "Auspiciador";
            const monto = Number(acuerdo.monto_comprometido || 0).toLocaleString("es-CL");
            const fechaRaw = acuerdo.fecha_comprometida || acuerdo.fecha_limite;
            const fechaPlazo = fechaRaw
              ? String(fechaRaw).slice(0, 10).split("-").reverse().slice(0, 2).join("/")
              : "";

            return (
              <div
                key={acuerdo.id_acuerdo || acuerdo.id}
                className="acuerdos-item"
              >
                <div className="acuerdos-item-info">
                  <p className="acuerdos-item-nombre">{nombreAuspiciador}</p>
                  <p className="acuerdos-item-glosa">
                    {acuerdo.glosa || "Acuerdo de auspicio"}
                  </p>
                </div>

                <div className="acuerdos-item-derecha">
                  <p className="acuerdos-item-monto">${monto}</p>
                  <div className="acuerdos-item-meta">
                    {fechaPlazo && (
                      <span className="acuerdos-item-plazo">Plazo: {fechaPlazo}</span>
                    )}
                    <span
                      className={`badge-estado-cobro ${
                        acuerdo.estado === "VENCIDO"
                          ? "badge-estado-vencido"
                          : acuerdo.estado === "PARCIAL"
                          ? "badge-estado-parcial"
                          : "badge-estado-pendiente"
                      }`}
                    >
                      {acuerdo.estado}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}