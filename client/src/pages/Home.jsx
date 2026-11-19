import AlertasKitsSinRetorno from "../components/equipos/AlertasKitsSinRetorno.jsx";
import EventosPendientesCierre from "../components/evento/EventosPendientesCierre.jsx";
import AuspiciadoresPorCobrar from "../components/acuerdos/AuspiciadoresPorCobrar.jsx";
import PanelPorRol from "../components/panel/PanelPorRol.jsx";
import "../styles/Home.css";

export default function Home() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const rol = String(usuario.rol ?? "").toUpperCase();

  const nombre =
    [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || "Usuario";

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
        {(rol === "DUENO" || rol === "CONTADOR") && <AuspiciadoresPorCobrar />}
      </section>
    </div>
  );
}