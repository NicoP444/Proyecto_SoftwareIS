import { useState } from 'react';
import FinanzasEventos from '../components/finanzas/FinanzaEvento.jsx';
// Cada persona agrega aquí su import cuando su archivo exista:
// import RentabilidadMes from '../components/finanzas/RentabilidadMes'; // Persona 2 (pendiente)
// import PagosCliente from '../components/finanzas/PagosCliente';       // Persona 1
import GastosFijos from '../components/finanzas/GastosFijos.jsx';     // Persona 4
import PerdidasInventario from '../components/finanzas/PerdidasInventario.jsx';
import ResumenInventario from '../components/finanzas/ResumenInventario.jsx';
import '../styles/Finanzas.css';


// Cada persona agrega UNA línea aquí con su pestaña
const PESTANAS = [
  { id: 'eventos', texto: 'Eventos', componente: FinanzasEventos }, // Persona 2 (P7)
  // { id: 'rentabilidad', texto: 'Rentabilidad', componente: RentabilidadMes },   // Persona 2 (pendiente)
  // { id: 'pagos-cliente', texto: 'Pagos del cliente', componente: PagosCliente }, // Persona 1 (RF-P1-10)
  { id: 'perdidas', texto: 'Pérdidas de Inventario', componente: PerdidasInventario },
  { id: 'mensual', texto: 'Gastos Fijos', componente: GastosFijos },        // Persona 4 (P8)
  { id: 'inventario-compras', texto: 'Inventario y Compras', componente: ResumenInventario },
];

export default function Finanzas() {
  const [activa, setActiva] = useState(PESTANAS[0].id);
  const Contenido = PESTANAS.find((p) => p.id === activa).componente;

  return (
    <div className="finanzas">
      <div className="fin-cabecera">
        <div>
          <h1>Finanzas</h1>
          <p>Gastos, remuneraciones y cierre financiero</p>
        </div>
      </div>

      {/* Con una sola pestaña no se muestra la barra */}
      {PESTANAS.length > 1 && (
        <nav className="fin-pestanas">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`fin-tab ${activa === p.id ? 'activa' : ''}`}
              onClick={() => setActiva(p.id)}
            >
              {p.texto}
            </button>
          ))}
        </nav>
      )}

      <Contenido />
    </div>
  );
}