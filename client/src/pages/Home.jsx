import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '12px' }}>
        <h2>Panel Principal</h2>
        <div>
          <span>Hola, <strong>{usuario.nombre || 'Usuario'}</strong> </span>
          <button onClick={handleLogout} style={{ marginLeft: '12px' }}>Cerrar sesión</button>
        </div>
      </header>

      {/* Aquí es donde cada compañero enchufa el acceso a su módulo */}
      <nav style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
        <button onClick={() => navigate('/trabajadores')}>Módulo Trabajadores</button>
        <button onClick={() => navigate('/auspiciadores')}>Módulo Auspiciadores</button>
        <button onClick={() => navigate('/coberturas')}>Módulo Coberturas</button>
        <button onClick={() => navigate('/incidentes')}>Módulo Incidentes</button>
      </nav>

      <main style={{ marginTop: '30px' }}>
        <p>Selecciona una opción del menú para comenzar a trabajar.</p>
      </main>
    </div>
  );
}