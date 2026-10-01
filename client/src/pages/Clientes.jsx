import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarClientes, crearCliente } from '../services/cliente.service.js';

const inputStyle = { width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px' };
const labelStyle = { display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' };
const cardStyle = { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '24px' };

export default function Clientes() {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState(null);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '', correo: '' });

  const cargarDatos = async () => {
    try {
      const data = await listarClientes();
      setClientes(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await crearCliente(nuevoCliente);
      setNuevoCliente({ nombre: '', telefono: '', correo: '' });
      cargarDatos();
    } catch (err) { setError(err.message); }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => navigate('/home')} style={{ marginBottom: '20px', padding: '8px 14px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        ← Volver al Home
      </button>

      <h1 style={{ marginBottom: '20px' }}>Clientes</h1>

      {error && (
        <div style={{ padding: '10px', background: '#ffe3e3', color: '#c92a2a', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={cardStyle}>
        <h2>Nuevo cliente</h2>
        <form onSubmit={handleCrearCliente}>
          <label style={labelStyle}>Nombre</label>
          <input style={inputStyle} value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} required />
          <label style={labelStyle}>Teléfono</label>
          <input style={inputStyle} value={nuevoCliente.telefono} onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} placeholder="+56 9 1234 5678" required />
          <label style={labelStyle}>Correo (opcional)</label>
          <input style={inputStyle} type="email" value={nuevoCliente.correo} onChange={(e) => setNuevoCliente({ ...nuevoCliente, correo: e.target.value })} />
          <button type="submit" style={{ padding: '8px 14px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Crear cliente</button>
        </form>
      </div>

      <div style={cardStyle}>
        <h2>Lista de clientes</h2>
        {clientes.length === 0 ? <p>Todavía no hay clientes registrados.</p> : (
          <ul>
            {clientes.map((c) => <li key={c.id_cliente}>{c.nombre} — {c.telefono}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}