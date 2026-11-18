import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Users,
  Package,
  UserCheck,
  Star,
  Wallet,
  Crown,
  Calculator,
  Wrench,
} from "lucide-react";
import { login } from "../services/auth.service.js";
import "../styles/Landing.css";

// Secciones informativas de abajo (cada link del menú baja a una de ellas)
const FUNCIONES = [
  { icono: CalendarDays, titulo: "Calendario de transmisiones", texto: "Todos los eventos del mes o la semana, con su estado por colores y filtros rápidos." },
  { icono: Users, titulo: "Clientes y eventos", texto: "Registra clientes por RUT y agenda eventos con horario, dirección y precio acordado." },
  { icono: UserCheck, titulo: "Personal y convocatorias", texto: "Revisa quién está libre en un horario, asígnalo al evento y genera la convocatoria." },
  { icono: Package, titulo: "Inventario y kits", texto: "Controla equipos y kits, su salida y retorno, y registra incidentes." },
  { icono: Star, titulo: "Auspiciadores", texto: "Registra acuerdos con auspiciadores y asócialos a cada transmisión." },
  { icono: Wallet, titulo: "Finanzas", texto: "Viabilidad de cada evento, pagos de clientes, gastos y cierre de mes." },
];

const ROLES = [
  { icono: Crown, titulo: "Dueño", texto: "Agenda y modifica eventos, gestiona clientes, personal y usuarios del sistema." },
  { icono: Calculator, titulo: "Contador", texto: "Registra pagos de clientes, revisa la rentabilidad y realiza el cierre de mes." },
  { icono: Wrench, titulo: "Jefe técnico", texto: "Administra equipos y kits, su salida y retorno, y los incidentes de cada evento." },
];

const PASOS = [
  { titulo: "Agenda el evento", texto: "Elige cliente, fecha, horario y precio. El sistema te indica si queda confirmado o pendiente de adelanto." },
  { titulo: "Asigna equipo y personal", texto: "Suma kits y trabajadores; si alguien no alcanza a llegar desde otro evento, el sistema te avisa." },
  { titulo: "Transmite y registra", texto: "Marca el evento como realizado y registra los incidentes o gastos que hubo." },
  { titulo: "Cierra el mes", texto: "Revisa pagos, gastos y rentabilidad de cada transmisión en un solo lugar." },
];

const PREGUNTAS = [
  { id: "acceso", pregunta: "¿Cómo obtengo una cuenta?", respuesta: "Las cuentas las crea el Dueño de la empresa desde «Administrar usuarios», dentro del sistema. Pídele que te registre con tu correo y el rol que te corresponde." },
  { pregunta: "Olvidé mi contraseña, ¿qué hago?", respuesta: "Contacta al Dueño de la empresa para que te asigne una nueva contraseña desde «Administrar usuarios»." },
  { pregunta: "¿Todos ven la misma información?", respuesta: "No. Cada rol ve solo lo que necesita: por ejemplo, el Jefe técnico no ve montos ni datos financieros." },
  { pregunta: "¿Puedo usarlo desde el celular?", respuesta: "Sí. La interfaz se adapta a pantallas pequeñas y el menú lateral se abre con el botón de arriba a la izquierda." },
];

export default function Landing() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const data = await login(correo, contrasena);

      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));

      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };
  // "Solicitar acceso": baja a la pregunta "¿Cómo obtengo una cuenta?" y la deja abierta
  function irAAcceso(e) {
    e.preventDefault();
    const pregunta = document.getElementById("acceso");
    if (!pregunta) return;
    pregunta.open = true;
    pregunta.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="landing">
      <nav>
        <div className="brand">
          {/* client/public/img/NombreEmpresa.png se sirve desde /img/NombreEmpresa.png */}
          <img
            className="brand-icon"
            src="/img/NombreEmpresa.png"
            alt="Logo de SixSeven"
          />
          SixSeven
        </div>
        <div className="nav-links">
          <a href="#funciones">Funciones</a>
          <a href="#roles">Roles</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#preguntas">Preguntas</a>
        </div>
        <div className="nav-actions">
          <a href="#acceso" className="btn btn-dark" onClick={irAAcceso}>
            Solicitar acceso
          </a>
        </div>
      </nav>

      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-text">
            <form className="login-card" onSubmit={handleSubmit}>
              <h1>Iniciar sesión</h1>
              <p className="lead">Accede para coordinar tus eventos.</p>

              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

              <label htmlFor="login-correo">Correo electrónico</label>
              <input
                id="login-correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="tucorreo@empresa.cl"
                autoComplete="email"
                required
              />

              <label htmlFor="login-contrasena">Contraseña</label>
              <input
                id="login-contrasena"
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Tu contraseña"
                autoComplete="current-password"
                required
              />

              <button
                type="submit"
                className="btn btn-dark login-submit"
                disabled={cargando}
              >
                {cargando ? "Ingresando..." : "Iniciar sesión"}
              </button>
            </form>
          </div>

          <div className="hero-visual">
            {/* Círculos concéntricos con la "línea fugaz" */}
            <div className="rings" aria-hidden="true">
              <svg viewBox="0 0 1100 1100">
                <circle className="ring" cx="550" cy="550" r="520" />
                <circle className="ring" cx="550" cy="550" r="380" />
              </svg>

              {/* Estela exterior: izquierda → derecha (sentido horario) */}
              <svg className="comet comet-outer" viewBox="0 0 1100 1100">
                <defs>
                  <linearGradient
                    id="trailOuter"
                    gradientUnits="userSpaceOnUse"
                    x1="124"
                    y1="0"
                    x2="550"
                    y2="0"
                  >
                    <stop offset="0" stopColor="#333c87" stopOpacity="0" />
                    <stop offset="1" stopColor="#333c87" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <path
                  d="M 124 251.7 A 520 520 0 0 1 550 30"
                  fill="none"
                  stroke="url(#trailOuter)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>

              {/* Estela interior: derecha → izquierda (sentido antihorario) */}
              <svg className="comet comet-inner" viewBox="0 0 1100 1100">
                <defs>
                  <linearGradient
                    id="trailInner"
                    gradientUnits="userSpaceOnUse"
                    x1="861"
                    y1="0"
                    x2="550"
                    y2="0"
                  >
                    <stop offset="0" stopColor="#333c87" stopOpacity="0" />
                    <stop offset="1" stopColor="#333c87" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <path
                  d="M 550 170 A 380 380 0 0 1 861.3 332"
                  fill="none"
                  stroke="url(#trailInner)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* client/public/img/ImagenLandpage.png se sirve desde /img/ImagenLandpage.png */}
            <img
              className="hero-img"
              src="/img/ImagenLandpage.png"
              alt="Vista de Enfoque"
            />

            {/* acá va la tarjeta del paso 2 */}
          </div>
        </div>
      </section>

      {/* ---------- Funciones ---------- */}
      <section id="funciones" className="info">
        <div className="wrap">
          <h2>Todo lo que necesitas para tus transmisiones</h2>
          <p className="info-sub">Un solo lugar para coordinar eventos, equipos, personal y finanzas.</p>
          <div className="info-grid">
            {FUNCIONES.map(({ icono: Icono, titulo, texto }) => (
              <article key={titulo} className="info-card">
                <span className="info-icono"><Icono size={20} /></span>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Roles ---------- */}
      <section id="roles" className="info info-alterna">
        <div className="wrap">
          <h2>Cada persona ve lo que necesita</h2>
          <p className="info-sub">El acceso depende del rol que tenga cada usuario en la empresa.</p>
          <div className="info-grid info-grid-3">
            {ROLES.map(({ icono: Icono, titulo, texto }) => (
              <article key={titulo} className="info-card">
                <span className="info-icono"><Icono size={20} /></span>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Cómo funciona ---------- */}
      <section id="como-funciona" className="info">
        <div className="wrap">
          <h2>Cómo funciona</h2>
          <p className="info-sub">Desde que el cliente reserva hasta que se cierra el mes.</p>
          <ol className="info-pasos">
            {PASOS.map(({ titulo, texto }, i) => (
              <li key={titulo}>
                <span className="info-numero">{i + 1}</span>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Preguntas frecuentes ---------- */}
      <section id="preguntas" className="info info-alterna">
        <div className="wrap info-angosto">
          <h2>Preguntas frecuentes</h2>
          <div className="info-faq">
            {PREGUNTAS.map(({ id, pregunta, respuesta }) => (
              <details key={pregunta} id={id}>
                <summary>{pregunta}</summary>
                <p>{respuesta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="info-pie">© {new Date().getFullYear()} SixSeven · Gestión de transmisiones en vivo</footer>
    </div>
  );
}