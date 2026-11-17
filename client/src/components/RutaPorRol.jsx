import { Navigate, Outlet } from 'react-router-dom';
import { obtenerUsuario } from '../services/http.js';

// Deja pasar solo a los roles indicados; el resto vuelve al panel principal
export default function RutaPorRol({ roles }) {
  const rol = String(obtenerUsuario()?.rol ?? '').toUpperCase();
  return roles.includes(rol) ? <Outlet /> : <Navigate to="/home" replace />;
}