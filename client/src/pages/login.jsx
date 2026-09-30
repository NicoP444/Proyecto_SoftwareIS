import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth.service.js';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState(''); 
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const data = await login(correo, contrasena);

      // Guardamos la sesión en el navegador
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      
      if (onLogin) onLogin(data.usuario);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ maxWidth: '380px', margin: '60px auto', padding: '24px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Iniciar Sesión</h2>

      {usuarioLogueado ? (
        <div style={{ padding: '16px', background: '#e6fffa', border: '1px solid #38b2ac', borderRadius: '6px', color: '#234e52' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>¡Bienvenido, {usuarioLogueado.nombre}!</h3>
          <p style={{ margin: '4px 0' }}><strong>Rol:</strong> {usuarioLogueado.rol}</p>
          <p style={{ margin: '4px 0' }}><strong>Correo:</strong> {usuarioLogueado.correo}</p>
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('usuario');
              setUsuarioLogueado(null);
            }}
            style={{ marginTop: '14px', padding: '8px 12px', cursor: 'pointer', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '4px' }}
          >
            Cerrar sesión
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: '10px', background: '#ffe3e3', color: '#c92a2a', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>Correo Electrónico:</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="admin@demo.com"
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>Contraseña:</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="******"
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
          >
            {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      )}
    </div>
  );
}