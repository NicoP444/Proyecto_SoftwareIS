import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/login";
import Home from "./pages/Home";
import Trabajadores from "./pages/Trabajadores";
import Auspiciadores from "./pages/Auspiciadores";
import Coberturas from "./pages/Coberturas";
import Incidentes from "./pages/Incidentes";
import Clientes from "./pages/Clientes";

// Componente para proteger rutas privadas (solo si hay token)
function RutaProtegida({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        {/* Rutas privadas (Inicio y módulos) */}
        <Route
          path="/home"
          element={
            <RutaProtegida>
              <>
                <Home />
              </>
            </RutaProtegida>
          }
        />
        <Route
          path="/trabajadores"
          element={
            <RutaProtegida>
              <Trabajadores /> {/*nico*/}
            </RutaProtegida>
          }
        />
        <Route
          path="/clientes"
          element={
            <RutaProtegida>
              <Clientes />
            </RutaProtegida>
          }
        />
        <Route
          path="/auspiciadores"
          element={
            <RutaProtegida>
              <Auspiciadores />
            </RutaProtegida>
          }
        />

        <Route
          path="/coberturas"
          element={
            <RutaProtegida>
              <Coberturas />
            </RutaProtegida>
          }
        />

        <Route
          path="/incidentes"
          element={
            <RutaProtegida>
              <Incidentes />
            </RutaProtegida>
          }
        />
        {/* Cada compañero agregará aquí su ruta, por ejemplo:
        <Route path="/productos" element={<RutaProtegida><Productos /></RutaProtegida>} />
        <Route path="/categorias" element={<RutaProtegida><Categorias /></RutaProtegida>} />
        */}

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
