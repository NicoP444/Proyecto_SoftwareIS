import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/auth.service.js";
import "../styles/Landing.css";

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
  return (
    <div className="landing">
      <nav>
        <div className="brand">
          {/* client/public/img/NombreEmpresa.png se sirve desde /img/NombreEmpresa.png */}
          <img
            className="brand-icon"
            src="/img/NombreEmpresa.png"
            alt="Logo de Enfoque"
          />
          NombreSistema
        </div>
        <div className="nav-links">
          <a href="#funciones">Funciones</a>
          <a href="#opiniones">Opiniones</a>
          <a href="#planes">Planes</a>
          <a href="#preguntas">Preguntas</a>
        </div>
        <div className="nav-actions">
          <a href="#" className="btn btn-dark">
            Solicitar acceso
          </a>
        </div>
      </nav>

      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-text">
            <form className="login-card" onSubmit={handleSubmit}>
              <h1>Iniciar sesión</h1>
              <p className="lead">Accede para coordinar tus coberturas.</p>

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
                placeholder="admin@demo.com"
                autoComplete="email"
                required
              />

              <label htmlFor="login-contrasena">Contraseña</label>
              <input
                id="login-contrasena"
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="******"
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
    </div>
  );
}
