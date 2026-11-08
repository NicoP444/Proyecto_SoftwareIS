import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Trabajadores from "./pages/Trabajadores";//nico
import Finanzas from "./pages/Finanzas";//nico
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
import MarcarEventoRealizado from './pages/MarcarEventoRealizado.jsx';

// Componente para proteger rutas privadas (solo si hay token)
function RutaProtegida({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/" element={<Landing />} />
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
         <Route element={<Plantilla />}>
            <Route path="/trabajadores" element={<Trabajadores />} /> /// nico
            <Route path="/finanzas" element={<Finanzas />} /> // nico
            <Route path="/calendario" element={<Calendario />} /> ///Jorge
            <Route path="/auspiciadores" element={<Auspiciadores />} /> ///gene
            <Route path="/auspiciadores/registrar-acuerdo" element={<RegistrarAcuerdoPage />} /> ///gene
            <Route path="/salida-kits" element={<SalidaKits />} /> ///seba
            <Route path="/marcar-evento" element={<MarcarEventoRealizado />} /> ///seba
            <Route path="/resumen-incidentes" element={<ResumenIncidentesEventoPage />} /> ///seba
            <Route path="/equipos/historial" element={<HistorialEquipo />} /> ///seba
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
