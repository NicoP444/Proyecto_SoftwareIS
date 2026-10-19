import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import MenuLateral from './MenuLateral';
import '../styles/Plantilla.css';

/**
 * Plantilla de las pantallas internas: barra superior + menú lateral + contenido.
 * En App.jsx se usa como ruta "padre" y cada página aparece en <Outlet />.
 */
export default function Plantilla({ nombreEmpresa = 'Empresa' }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  // El Login guardó el usuario en el navegador
  const guardado = localStorage.getItem('usuario');
  const usuario = guardado ? JSON.parse(guardado) : { nombre: 'Administrador Demo', rol: 'Gerente' };

  return (
    <div className="plantilla">
      <header className="barra-superior">
        <div className="marca">
          {/* Solo se ve en celular */}
          <button type="button" className="boton-icono boton-menu" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Abrir menú">
            <Menu size={22} />
          </button>
          <span className="marca-logo">{nombreEmpresa.charAt(0)}</span>
          <span className="marca-nombre">{nombreEmpresa}</span>
        </div>
        <div className="usuario">
          <div className="usuario-texto">
            <strong>{usuario.nombre}</strong>
            <span>{usuario.rol}</span>
          </div>
          <span className="usuario-avatar">{usuario.nombre?.charAt(0)}</span>
        </div>
      </header>

      <MenuLateral abierto={menuAbierto} onNavegar={() => setMenuAbierto(false)} />
      <main className="contenido">
        <Outlet />
      </main>
    </div>
  );
}
