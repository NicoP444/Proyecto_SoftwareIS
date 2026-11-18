import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, Calendar, Package, Wrench, TrendingDown, AlertTriangle, User, Star, DollarSign, LogOut } from 'lucide-react';
import { obtenerUsuario } from '../services/http.js';
import '../styles/MenuLateral.css';
import { logout } from '../services/auth.service.js';

// Roles que guarda el login
const DUENO = 'DUENO';
const CONTADOR = 'CONTADOR';
const JEFE = 'JEFE_TECNICO';

// Opciones del menú. Para agregar un módulo nuevo, se agrega una línea aquí.
// `roles` indica quién la ve; si no lleva `roles`, la ven todos.
const OPCIONES = [
  { ruta: '/home', texto: 'Panel Principal', icono: LayoutGrid },
  { ruta: '/calendario', texto: 'Calendario', icono: Calendar },
  { ruta: '/consulta-inventario', texto: 'Inventario', icono: Package },
  { ruta: '/equipos', texto: 'Gestión de Equipos', icono: Wrench, roles: [JEFE] },
  { ruta: '/salida-kits?tab=incidentes', texto: 'Incidentes', icono: AlertTriangle, roles: [JEFE] },
  { ruta: '/trabajadores', texto: 'Personal', icono: User, roles: [DUENO] },
  { ruta: '/auspiciadores', texto: 'Auspiciadores', icono: Star, roles: [DUENO, CONTADOR] },
  { ruta: '/finanzas', texto: 'Finanzas', icono: DollarSign, roles: [DUENO, CONTADOR] },
  { ruta: '/perdidas-inventario', texto: 'Pérdidas', icono: TrendingDown, roles: [JEFE] },
];

/**
 * Menú lateral del sistema. Lo puede usar cualquier página:
 *   <MenuLateral />
 */
export default function MenuLateral({ abierto = false, onNavegar }) {
  const navigate = useNavigate();

  // Solo se muestran las opciones que corresponden al rol de quien inició sesión
  const rol = String(obtenerUsuario()?.rol ?? '').toUpperCase();
  const visibles = OPCIONES.filter((o) => !o.roles || o.roles.includes(rol));

  async function cerrarSesion() {
    await logout();
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/', { replace: true });
  }

  return (
    <aside className={`menu-lateral ${abierto ? 'abierto' : ''}`}>
      <nav className="menu-opciones">
        {visibles.map(({ ruta, texto, icono: Icono }) => (
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