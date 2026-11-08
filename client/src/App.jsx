import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Trabajadores from "./pages/Trabajadores"; //nico
import Finanzas from "./pages/Finanzas"; //nico
import Auspiciadores from "./pages/Auspiciadores";
import Coberturas from "./pages/Coberturas";
import Incidentes from "./pages/Incidentes";
import Clientes from "./pages/Clientes";
import RegistrarAcuerdoPage from "./pages/RegistrarAcuerdo";
import SalidaKits from "./pages/SalidaKits";
import Plantilla from "./components/Plantilla"; 
import HistorialEquipo from './pages/HistorialEquipo.jsx';
import Calendario from "./pages/Calendario";
import ResumenIncidentesEventoPage from './pages/ResumenIncidentesEventoPage.jsx';
import Equipos from "./pages/Equipos";

// Componente para proteger rutas privadas
function RutaProtegida({ children }) {
  const token = localStorage.getItem("token") || localStorage.getItem("usuario");
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/" element={<Plantilla />}>
  <Route index element={<Equipos />} />
</Route>

        {/* Ruta privada Home */}
        <Route
          path="/home"
          element={
            <RutaProtegida>
              <Home />
            </RutaProtegida>
          }
        />

        {/* Rutas con barra lateral (Plantilla protegida) */}
        <Route
          element={
            <RutaProtegida>
              <Plantilla />
            </RutaProtegida>
          }
        >
          <Route path="/trabajadores" element={<Trabajadores />} />
          <Route path="/finanzas" element={<Finanzas />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/auspiciadores" element={<Auspiciadores />} />
          <Route path="/auspiciadores/registrar-acuerdo" element={<RegistrarAcuerdoPage />} />
          <Route path="/equipos" element={<Equipos />} />
        </Route>

        <Route
          path="/clientes"
          element={
            <RutaProtegida>
              <Clientes />
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

        <Route
          path="/salida-kits"
          element={
            <RutaProtegida>
              <SalidaKits />
            </RutaProtegida>
          }
        />

        <Route
          path="/equipos/historial"
          element={
            <RutaProtegida>
              <HistorialEquipo />
            </RutaProtegida>
          }
        />
        
        <Route
          path="/resumen-incidentes"
          element={
            <RutaProtegida>
              <ResumenIncidentesEventoPage />
            </RutaProtegida>
          }
        />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}