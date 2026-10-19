import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Home.css";

// Íconos (trazo simple, heredan el color del texto)
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
  inicio: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  inventario: (
    <>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </>
  ),
  personal: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </>
  ),
  finanzas: (
    <path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  ),
  auspiciadores: (
    <path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.4 6.7 19.1l1-5.8L3.5 9.2l5.9-.9z" />
  ),
  coberturas: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M16 10l5-3v10l-5-3z" />
    </>
  ),
  incidentes: (
    <>
      <path d="M12 3L2 20h20z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  clientes: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </>
  ),
  salir: (
    <>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l-5-5 5-5M5 12h11" />
    </>
  ),
};

// Cada compañero agrega aquí el acceso a su módulo
const MODULOS = [
  { ruta: "/calendario", titulo: "Calendario", icono: "calendario" },
  { ruta: "/inventario", titulo: "Inventario", icono: "inventario" },
  { ruta: "/trabajadores", titulo: "Personal", icono: "personal" },
  { ruta: "/auspiciadores", titulo: "Auspiciadores", icono: "auspiciadores" },
  { ruta: "/finanzas", titulo: "Finanzas", icono: "finanzas" },
];

// Indicadores del resumen mensual (se llenarán cuando exista el back)
const KPIS = [
  { titulo: "Utilidad Neta", color: "verde", vacio: "Sin datos este mes" },
  {
    titulo: "Ingresos por Transmisión",
    color: "azul",
    vacio: "Sin transmisiones registradas",
  },
  {
    titulo: "Remuneraciones Pagadas",
    color: "naranja",
    vacio: "Sin pagos registrados",
  },
  {
    titulo: "Pérdidas de Inventario",
    color: "rojo",
    vacio: "Sin incidentes este mes",
  },
];

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
  const mesActual = new Date().toLocaleString("es-CL", { month: "long" });
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  // Evita mostrar "undefined undefined" si falta algún campo
  const nombre =
    [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || "Usuario";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <div className="layout">
      {/* ---------- Barra superior ---------- */}
      <header className="topbar">
        <div className="brand">
          <span className="brand-logo">E</span>
          <span className="brand-name">
            <span>Empresa</span>
          </span>
        </div>
        <div className="topbar-user">
          <div className="topbar-user-text">
            <div className="user-name">{nombre}</div>
            <div className="user-role">Gerente</div>
          </div>
          <div className="avatar">{nombre.charAt(0).toUpperCase()}</div>
        </div>
      </header>

      {/* ---------- Menú lateral ---------- */}
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${pathname === "/" || pathname === "/home" ? "active" : ""}`}
            onClick={() => navigate("/")}
          >
            <Icono>{ICONOS.inicio}</Icono>
            Panel Principal
          </button>

          {MODULOS.map((m) => (
            <button
              key={m.ruta}
              className={`nav-item ${pathname.startsWith(m.ruta) ? "active" : ""}`}
              onClick={() => navigate(m.ruta)}
            >
              <Icono>{ICONOS[m.icono]}</Icono>
              {m.titulo}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout" onClick={handleLogout}>
            <Icono>{ICONOS.salir}</Icono>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ---------- Contenido ---------- */}
      <main className="content">
        <h1 className="page-title">Panel Principal</h1>
        <p className="page-subtitle">
          Hola, {nombre}. Este es el resumen general de la empresa.
        </p>

        {/* ---------- Resumen del mes ---------- */}
        <div className="section-heading">
          <h2>Resumen de {mesActual}</h2>
          <span className="section-line" />
        </div>

        <section className="kpis">
          {KPIS.map((k) => (
            <div key={k.titulo} className={`kpi kpi-${k.color}`}>
              <span className="kpi-label">{k.titulo}</span>
              <span className="kpi-value">—</span>
              <span className="kpi-note">{k.vacio}</span>
            </div>
          ))}
        </section>

        {/* ---------- Alertas recientes ---------- */}
        <section className="panel">
          <div className="panel-head">
            <h3>
              <Icono>{ICONOS.incidentes}</Icono>
              Alertas recientes
            </h3>
            <button
              className="panel-link"
              onClick={() => navigate("/inventario")}
            >
              Ver inventario →
            </button>
          </div>
          <EstadoVacio texto="No hay alertas registradas" />
        </section>

        {/* ---------- Transmisiones y auspiciadores ---------- */}
        <section className="panels-row">
          <div className="panel">
            <div className="panel-head">
              <h3>
                <Icono>{ICONOS.calendario}</Icono>
                Próximas transmisiones
              </h3>
              <button
                className="panel-link"
                onClick={() => navigate("/calendario")}
              >
                Ver calendario →
              </button>
            </div>
            <EstadoVacio texto="No hay transmisiones programadas" />
          </div>

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
            <EstadoVacio texto="No hay cobros pendientes" />
          </div>
        </section>
      </main>
    </div>
  );
}
