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
import ConsultaInventario from './pages/ConsultarInventario.jsx';
import MarcarEventoRealizado from './pages/MarcarEventoRealizado.jsx';

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

        {/* Ruta privada Home */}
        <Route
          path="/home"
          element={
            <RutaProtegida>
              <Home />
            </RutaProtegida>
          }
        />

        {/* Rutas con barra lateral */}
        <Route element={<Plantilla />}>
          <Route path="/trabajadores" element={<Trabajadores />} />
          <Route path="/finanzas" element={<Finanzas />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/auspiciadores" element={<Auspiciadores />} />
          <Route path="/auspiciadores/registrar-acuerdo" element={<RegistrarAcuerdoPage />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/salida-kits" element={<SalidaKits />} />
          <Route path="/marcar-evento" element={<MarcarEventoRealizado />} />
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

        <Route
          path="/consulta-inventario"
          element={
            <RutaProtegida>
              <ConsultaInventario />
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

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}