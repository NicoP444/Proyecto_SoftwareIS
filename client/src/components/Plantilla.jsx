import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Settings } from 'lucide-react';
import MenuLateral from './MenuLateral';
import ModalGestionUsuarios from '../components/usuarios/ModalGestionUsuarios';
import '../styles/Plantilla.css';

/**
 * Plantilla de las pantallas internas: barra superior + menú lateral + contenido.
 * En App.jsx se usa como ruta "padre" y cada página aparece en <Outlet /> contiene layout.
 */
export default function Plantilla({ nombreEmpresa = 'SixSeven' }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalUsuariosAbierto, setModalUsuariosAbierto] = useState(false);
  // El Login guardó el usuario en el navegador
  const guardado = localStorage.getItem('usuario');
  const usuario = guardado ? JSON.parse(guardado) : { nombre: 'Administrador Demo', rol: 'Gerente' };
  const rol = String(usuario.rol ?? '').toUpperCase();

  return (
    <div className="plantilla">
      <header className="barra-superior">
        <div className="marca">
          {/* Solo se ve en celular */}
          <button type="button" className="boton-icono boton-menu" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Abrir menú">
            <Menu size={22} />
          </button>
          <span className="marca-logo">{nombreEmpresa.charAt(0)}</span>
          <span className="marca-nombre">{nombreEmpresa}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}> 
          {/* 3. Botón de la tuerca visible solo para el DUEÑO */}
          {rol === 'DUENO' && (
            <button
              type="button"
              onClick={() => setModalUsuariosAbierto(true)}
              title="Administrar Usuarios"
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#475569',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'background 0.2s'
              }}
            >
              <Settings size={18} />
            </button>
          )}
        
        <div className="usuario">
          <div className="usuario-texto">
            <strong>{usuario.nombre}</strong>
            <span>{usuario.rol}</span>
          </div>
          <span className="usuario-avatar">{usuario.nombre?.charAt(0)}</span>
        </div>
        </div>
      </header>
      
      <MenuLateral abierto={menuAbierto} onNavegar={() => setMenuAbierto(false)} />
      <main className="contenido">
        <Outlet />
      </main>

{/* Modal de gestión de usuarios */}
      <ModalGestionUsuarios 
        isOpen={modalUsuariosAbierto} 
        onClose={() => setModalUsuariosAbierto(false)} 
        idDueno={usuario.id_dueno || usuario.id || 1} 
      />

    </div>
  );
}
