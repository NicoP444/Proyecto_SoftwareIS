import { useNavigate } from 'react-router-dom';
import '../styles/Landing.css';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <nav>
        <div className="brand">
          {/* client/public/img/NombreEmpresa.png se sirve desde /img/NombreEmpresa.png */}
          <img className="brand-icon" src="/img/NombreEmpresa.png" alt="Logo de Enfoque" />
          NombreSistema
        </div>
        <div className="nav-links">
          <a href="#funciones">Funciones</a>
          <a href="#opiniones">Opiniones</a>
          <a href="#planes">Planes</a>
          <a href="#preguntas">Preguntas</a>
        </div>
        <div className="nav-actions">
          <button className="btn" onClick={() => navigate('/login')}>Iniciar sesión</button>
          <a href="#" className="btn btn-dark">Solicitar acceso</a>
        </div>
      </nav>

      <section className="hero">
        <div className="wrap hero-grid">
           <div className="hero-text">   {/* antes: <div> */}
            <h1>Ningún evento se cae por una fecha mal coordinada.</h1>
            <p className="lead">Enfoque centraliza tus clientes, recintos y equipos técnicos, y confirma cada cobertura automáticamente según sus propias reglas de negocio.</p>
            <div className="hero-ctas">
              <a href="#" className="btn btn-dark">Solicitar acceso</a>
              <a href="#funciones" className="btn">Ver cómo funciona →</a>
            </div>
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
                  <linearGradient id="trailOuter" gradientUnits="userSpaceOnUse" x1="124" y1="0" x2="550" y2="0">
                    <stop offset="0" stopColor="#38BDF8" stopOpacity="0" />
                    <stop offset="1" stopColor="#38BDF8" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <path d="M 124 251.7 A 520 520 0 0 1 550 30" fill="none" stroke="url(#trailOuter)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>

              {/* Estela interior: derecha → izquierda (sentido antihorario) */}
              <svg className="comet comet-inner" viewBox="0 0 1100 1100">
                <defs>
                  <linearGradient id="trailInner" gradientUnits="userSpaceOnUse" x1="861" y1="0" x2="550" y2="0">
                    <stop offset="0" stopColor="#38BDF8" stopOpacity="0" />
                    <stop offset="1" stopColor="#38BDF8" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <path d="M 550 170 A 380 380 0 0 1 861.3 332" fill="none" stroke="url(#trailInner)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* client/public/img/ImagenLandpage.png se sirve desde /img/ImagenLandpage.png */}
            <img className="hero-img" src="/img/ImagenLandpage.png" alt="Vista de Enfoque" />

            {/* acá va la tarjeta del paso 2 */}
          </div>
        </div>
      </section>
    </div>
  );
}