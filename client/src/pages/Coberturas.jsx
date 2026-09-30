import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listarClientes, crearCliente,
  listarCoberturas, crearCobertura, eliminarCobertura
} from '../services/coberturas.service.js';

const ESTADOS = {
  PENDIENTE_ADELANTO: { texto: 'Pendiente de adelanto', color: '#b45309', fondo: '#fef3c7' },
  CONFIRMADO: { texto: 'Confirmado', color: '#065f46', fondo: '#d1fae5' },
  REALIZADO: { texto: 'Realizado', color: '#1e3a8a', fondo: '#dbeafe' },
  CERRADO: { texto: 'Cerrado', color: '#374151', fondo: '#e5e7eb' }
};

function EstadoBadge({ estado }) {
  const info = ESTADOS[estado] || { texto: estado, color: '#374151', fondo: '#e5e7eb' };
  return (
    <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', color: info.color, background: info.fondo }}>
      {info.texto}
    </span>
  );
}

function formatHora(valor) {
  if (!valor) return '';
  return new Date(valor).toISOString().substring(11, 16);
}

function formatFecha(valor) {
  if (!valor) return '';
  return new Date(valor).toISOString().substring(0, 10);
}

const inputStyle = { width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px' };
const labelStyle = { display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' };
const cardStyle = { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '24px' };

export default function Coberturas() {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [coberturas, setCoberturas] = useState([]);
  const [error, setError] = useState(null);

  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '', correo: '' });
  const [nuevaCobertura, setNuevaCobertura] = useState({
    tipo: '', fecha: '', hora_inicio: '', hora_termino: '', direccion: '',
    cantidad_camaras: 1, precio_acordado: '', observaciones: '',
    id_cliente: ''
  });

  const cargarDatos = async () => {
    try {
      const [clientesData, coberturasData] = await Promise.all([
        listarClientes(), listarCoberturas()
      ]);
      setClientes(clientesData);
      setCoberturas(coberturasData);
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

  const handleCrearCobertura = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await crearCobertura(nuevaCobertura);
      setNuevaCobertura({
        tipo: '', fecha: '', hora_inicio: '', hora_termino: '', direccion: '',
        cantidad_camaras: 1, precio_acordado: '', observaciones: '',
        id_cliente: ''
      });
      cargarDatos();
    } catch (err) { setError(err.message); }
  };

  const handleEliminar = async (id) => {
    setError(null);
    try {
      await eliminarCobertura(id);
      cargarDatos();
    } catch (err) { setError(err.message); }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: '20px', padding: '8px 14px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        ← Volver al inicio
      </button>

      <h1 style={{ marginBottom: '20px' }}>Coberturas</h1>

      {error && (
        <div style={{ padding: '10px', background: '#ffe3e3', color: '#c92a2a', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={cardStyle}>
        <h2>Clientes</h2>
        <form onSubmit={handleCrearCliente}>
          <label style={labelStyle}>Nombre</label>
          <input style={inputStyle} value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} required />
          <label style={labelStyle}>Teléfono</label>
          <input style={inputStyle} value={nuevoCliente.telefono} onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} placeholder="+56 9 1234 5678" required />
          <label style={labelStyle}>Correo (opcional)</label>
          <input style={inputStyle} type="email" value={nuevoCliente.correo} onChange={(e) => setNuevoCliente({ ...nuevoCliente, correo: e.target.value })} />
          <button type="submit" style={{ padding: '8px 14px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Crear cliente</button>
        </form>

        <h3 style={{ marginTop: '20px' }}>Lista de clientes</h3>
        {clientes.length === 0 ? <p>Todavía no hay clientes registrados.</p> : (
          <ul>
            {clientes.map((c) => <li key={c.id_cliente}>{c.nombre} — {c.telefono}</li>)}
          </ul>
        )}
      </div>

      <div style={cardStyle}>
        <h2>Agendar cobertura</h2>
        <form onSubmit={handleCrearCobertura}>
          <label style={labelStyle}>Tipo de evento</label>
          <input style={inputStyle} value={nuevaCobertura.tipo} onChange={(e) => setNuevaCobertura({ ...nuevaCobertura, tipo: e.target.value })} placeholder="Matrimonio, cumpleaños, etc." required />

          <label style={labelStyle}>Cliente</label>
          <select style={inputStyle} value={nuevaCobertura.id_cliente} onChange={(e) => setNuevaCobertura({ ...nuevaCobertura, id_cliente: e.target.value })} required>
            <option value="">Selecciona un cliente</option>
            {clientes.map((c) => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>)}
          </select>

          <label style={labelStyle}>Dirección del evento</label>
          <input style={inputStyle} value={nuevaCobertura.direccion} onChange={(e) => setNuevaCobertura({ ...nuevaCobertura, direccion: e.target.value })} placeholder="Calle, número, comuna" required />

          <label style={labelStyle}>Fecha</label>
          <input style={inputStyle} type="date" value={nuevaCobertura.fecha} onChange={(e) => setNuevaCobertura({ ...nuevaCobertura, fecha: e.target.value })} required />

          <label style={labelStyle}>Hora de inicio</label>
          <input style={inputStyle} type="time" value={nuevaCobertura.hora_inicio} onChange={(e) => setNuevaCobertura({ ...nuevaCobertura, hora_inicio: e.target.value })} required />

          <label style={labelStyle}>Hora de término</label>
          <input style={inputStyle} type="time" value={nuevaCobertura.hora_termino} onChange={(e) => setNuevaCobertura({ ...nuevaCobertura, hora_termino: e.target.value })} required />

          <label style={labelStyle}>Cantidad de cámaras</label>
          <input style={inputStyle} type="number" min="1" value={nuevaCobertura.cantidad_camaras} onChange={(e) => setNuevaCobertura({ ...nuevaCobertura, cantidad_camaras: e.target.value })} required />

          <label style={labelStyle}>Precio acordado (CLP)</label>
          <input style={inputStyle} type="number" min="1" value={nuevaCobertura.precio_acordado} onChange={(e) => setNuevaCobertura({ ...nuevaCobertura, precio_acordado: e.target.value })} required />

          <label style={labelStyle}>Observaciones (opcional)</label>
          <textarea style={inputStyle} value={nuevaCobertura.observaciones} onChange={(e) => setNuevaCobertura({ ...nuevaCobertura, observaciones: e.target.value })} />

          <button type="submit" style={{ padding: '8px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Agendar cobertura</button>
        </form>
      </div>

      <div style={cardStyle}>
        <h2>Lista de coberturas</h2>
        {coberturas.length === 0 ? <p>Todavía no hay coberturas agendadas.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '8px' }}>Fecha</th>
                <th style={{ padding: '8px' }}>Horario</th>
                <th style={{ padding: '8px' }}>Cliente</th>
                <th style={{ padding: '8px' }}>Dirección</th>
                <th style={{ padding: '8px' }}>Cámaras</th>
                <th style={{ padding: '8px' }}>Precio</th>
                <th style={{ padding: '8px' }}>Estado</th>
                <th style={{ padding: '8px' }}></th>
              </tr>
            </thead>
            <tbody>
              {coberturas.map((ev) => (
                <tr key={ev.id_evento} style={{ borderBottom: '1px solid #f1f1f1' }}>
                  <td style={{ padding: '8px' }}>{formatFecha(ev.fecha)}</td>
                  <td style={{ padding: '8px' }}>{formatHora(ev.hora_inicio)} - {formatHora(ev.hora_termino)}</td>
                  <td style={{ padding: '8px' }}>{ev.cliente?.nombre}</td>
                  <td style={{ padding: '8px' }}>{ev.direccion}</td>
                  <td style={{ padding: '8px' }}>{ev.cantidad_camaras}</td>
                  <td style={{ padding: '8px' }}>${Number(ev.precio_acordado).toLocaleString('es-CL')}</td>
                  <td style={{ padding: '8px' }}><EstadoBadge estado={ev.estado} /></td>
                  <td style={{ padding: '8px' }}>
                    <button onClick={() => handleEliminar(ev.id_evento)} style={{ padding: '4px 10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}