import PerdidasInventario from '../components/finanzas/PerdidasInventario.jsx';
import '../styles/Finanzas.css';

export default function PerdidasInventarioJefe() {
  return (
    <div className="finanzas">
      <div className="fin-cabecera">
        <div>
          <h1>Pérdidas de inventario</h1>
          <p>Incidentes valorizados del mes</p>
        </div>
      </div>
      <PerdidasInventario />
    </div>
  );
}