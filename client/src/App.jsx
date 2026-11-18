import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Trabajadores from "./pages/Trabajadores"; //nico
import Finanzas from "./pages/Finanzas"; //nico
import Auspiciadores from "./pages/Auspiciadores";
import Incidentes from "./pages/Incidentes";
import RegistrarAcuerdoPage from "./pages/RegistrarAcuerdo";
import SalidaKits from "./pages/SalidaKits";
import Plantilla from "./components/Plantilla";
import RutaPorRol from "./components/RutaPorRol";
import Calendario from "./pages/Calendario";
import Equipos from "./pages/Equipos";
import MarcarEventoRealizado from './pages/MarcarEventoRealizado.jsx';
import ConsultarInventario from './pages/ConsultarInventario.jsx';
import Kits from "./pages/Kits";

// Componente para proteger rutas privadas
function RutaProtegida({ children }) {
  const token = localStorage.getItem("token") || localStorage.getItem("usuario");
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* Rutas con barra lateral: protegidas por sesión y por rol */}
        <Route element={<RutaProtegida><Plantilla /></RutaProtegida>}>

          {/* Todos los roles */}
          <Route path="/home" element={<Home />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/consulta-inventario" element={<ConsultarInventario />} />

          {/* Dueño y Contador */}
          <Route element={<RutaPorRol roles={["DUENO", "CONTADOR"]} />}>
            <Route path="/finanzas" element={<Finanzas />} />
            <Route path="/auspiciadores" element={<Auspiciadores />} />
          </Route>

          {/* Solo el Dueño */}
          <Route element={<RutaPorRol roles={["DUENO"]} />}>
            <Route path="/trabajadores" element={<Trabajadores />} />
            <Route path="/auspiciadores/registrar-acuerdo" element={<RegistrarAcuerdoPage />} />
            <Route path="/marcar-evento" element={<MarcarEventoRealizado />} />
          </Route>

          {/* Solo el Jefe de área técnica */}
          <Route element={<RutaPorRol roles={["JEFE_TECNICO"]} />}>
            <Route path="/equipos" element={<Equipos />} />
            <Route path="/kits" element={<Kits />} />
            <Route path="/salida-kits" element={<SalidaKits />} />
          </Route>
        </Route>
        <Route
          path="/incidentes"
          element={
            <RutaProtegida>
              <Incidentes />
            </RutaProtegida>
          }
        />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}