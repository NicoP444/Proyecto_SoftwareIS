import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AlertasKitsSinRetorno from "../components/equipos/AlertasKitsSinRetorno.jsx";
import EventosPendientesCierre from "../components/evento/EventosPendientesCierre.jsx";
import { obtenerAcuerdos } from "../services/acuerdoService";
import PanelPorRol from "../components/panel/PanelPorRol.jsx";
import "../styles/Home.css";

// Íconos de los títulos de los paneles
const Icono = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
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

export default function Home() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const rol = String(usuario.rol ?? "").toUpperCase();

  const nombre =
    [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || "Usuario";
  const verFinanzas = rol === "DUENO" || rol === "CONTADOR";
  const [cobrosPendientes, setCobrosPendientes] = useState([]);
  const [cargandoCobros, setCargandoCobros] = useState(true);

  useEffect(() => {
    if (!verFinanzas) return; // el Jefe técnico no ve auspicios por cobrar
    const cargarCobros = async () => {
      try {
        setCargandoCobros(true);
        const data = await obtenerAcuerdos();
        
        const pendientes = Array.isArray(data)
          ? data.filter(item => ['PENDIENTE', 'PARCIAL', 'VENCIDO'].includes(item.estado))
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
  }, [verFinanzas]);
  

  return (
       <div className="panel-principal">
        <h1 className="page-title">Panel Principal</h1>
        <p className="page-subtitle">
          Hola, {nombre}. Este es el resumen general de la empresa.
        </p>
        {/* RF-T-07: panel de inicio según el rol */}
        <PanelPorRol rol={rol} />
        {/* Alertas recientes */}
        {(rol === "DUENO" || rol === "JEFE_TECNICO") && <AlertasKitsSinRetorno />}

        {/* Eventos por Finalizar */}
       {rol === "DUENO" && <EventosPendientesCierre />}

        {/* Transmisiones y auspiciadores */}
        <section className="panels-row">
          {(rol === "DUENO" || rol === "CONTADOR") && (
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
              <p style={{ fontSize: "13px", color: "#64748b", textAlign: "center", padding: "20px 0" }}>
                Cargando cobros...
              </p>
            ) : cobrosPendientes.length === 0 ? (
              <EstadoVacio texto="No hay cobros pendientes" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "220px", overflowY: "auto", marginTop: "10px" }}>
                {cobrosPendientes.map((acuerdo) => {
                  const nombreAuspiciador = acuerdo.auspiciador?.nombre || "Auspiciador";
                  const monto = Number(acuerdo.monto_comprometido || 0).toLocaleString("es-CL");
                  const esVencido = acuerdo.estado === "VENCIDO";
                  const fechaRaw = acuerdo.fecha_comprometida || acuerdo.fecha_limite;
                  const fechaPlazo = fechaRaw
                  ? String(fechaRaw).slice(0, 10).split("-").reverse().slice(0, 2).join("/")
                  : "";   

                  return (
                    <div 
                      key={acuerdo.id_acuerdo || acuerdo.id} 
                      style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        padding: "10px 12px", 
                        backgroundColor: "#f8fafc", 
                        borderRadius: "8px", 
                        border: "1px solid #f1f5f9" 
                      }}
                    >
                      <div style={{ overflow: "hidden" }}>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {nombreAuspiciador}
                        </p>
                        <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {acuerdo.glosa || "Acuerdo de auspicio"}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                          ${monto}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", marginTop: "2px" }}>
                          {fechaPlazo && (
                            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "500" }}>
                              Plazo: {fechaPlazo}
                            </span>
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
        )}
        </section>
       </div>
  );
}