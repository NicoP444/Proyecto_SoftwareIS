import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, Calendar, Package, User, Star, DollarSign, LogOut } from 'lucide-react';
import '../styles/MenuLateral.css';

// Opciones del menú. Para agregar un módulo nuevo, se agrega una línea aquí.
const OPCIONES = [
  { ruta: '/home', texto: 'Panel Principal', icono: LayoutGrid },
  { ruta: '/calendario', texto: 'Calendario', icono: Calendar },
  { ruta: '/inventario', texto: 'Inventario', icono: Package },
  { ruta: '/trabajadores', texto: 'Personal', icono: User },
  { ruta: '/auspiciadores', texto: 'Auspiciadores', icono: Star },
  { ruta: '/finanzas', texto: 'Finanzas', icono: DollarSign },
];

/**
 * Menú lateral del sistema. Lo puede usar cualquier página:
 *   <MenuLateral />
 */
export default function MenuLateral({ abierto = false, onNavegar }) {
  const navigate = useNavigate();

  function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/', { replace: true });
  }

  return (
    <aside className={`menu-lateral ${abierto ? 'abierto' : ''}`}>
      <nav className="menu-opciones">
        {OPCIONES.map(({ ruta, texto, icono: Icono }) => (
          // NavLink agrega la clase "active" cuando estás en esa página
          <NavLink key={ruta} to={ruta} className="menu-enlace" onClick={onNavegar}>
            <Icono />
            {texto}
          </NavLink>
        ))}
      </nav>

      <div className="menu-pie">
        <button type="button" className="menu-enlace menu-salir" onClick={cerrarSesion}>
          <LogOut />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
