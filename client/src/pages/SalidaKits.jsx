import React, { useState, useEffect } from 'react';
import { 
  obtenerKitsPorEvento, 
  registrarSalidaKit, 
  obtenerEventos 
} from '../services/salidaKit.service.js';

export default function SalidaKits() {
  const [eventos, setEventos] = useState([]);
  const [idEventoSeleccionado, setIdEventoSeleccionado] = useState('');
  const [reservas, setReservas] = useState([]);
  const [personal, setPersonal] = useState([]);
  
  // Guardar el trabajador responsable asignado a cada reserva: { [id_reserva]: id_asignacion }
  const [responsables, setResponsables] = useState({});
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cargando, setCargando] = useState(false);

  // 1. Cargar lista de eventos al inicio
  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      // Ajusta según cómo se llame la función de traer eventos en tu coberturas.service.js
      const res = await obtenerEventos();
      setEventos(res.data || res || []);
    } catch (error) {
      console.error('Error cargando eventos:', error);
    }
  };

  // 2. Al seleccionar un evento, cargar sus kits reservados y personal
  const manejarCambioEvento = async (e) => {
    const id = e.target.value;
    setIdEventoSeleccionado(id);
    setMensaje({ tipo: '', texto: '' });
    if (!id) {
      setReservas([]);
      setPersonal([]);
      return;
    }

    try {
      setCargando(true);
      const res = await obtenerKitsPorEvento(id);
      const data = res.data || res;
      setReservas(data.reservas || []);
      setPersonal(data.personalAsignado || []);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'Error al cargar kits del evento' });
    } finally {
      setCargando(false);
    }
  };

  // Manejar el cambio de responsable para un kit en específico
  const manejarCambioResponsable = (idReserva, idAsignacion) => {
    setResponsables((prev) => ({
      ...prev,
      [idReserva]: idAsignacion,
    }));
  };

  // 3. Registrar la salida del kit
  const handleRegistrarSalida = async (idReserva) => {
    const idAsignacion = responsables[idReserva];
    if (!idAsignacion) {
      setMensaje({ tipo: 'error', texto: 'Debes seleccionar un trabajador responsable para el kit' });
      return;
    }

    try {
      setMensaje({ tipo: '', texto: '' });
      await registrarSalidaKit({
        id_reserva: idReserva,
        id_asignacion: idAsignacion,
        fecha_hora_salida: new Date().toISOString(),
      });

      setMensaje({ tipo: 'exito', texto: 'Salida de kit registrada con éxito' });
      
      // Recargar la lista para reflejar el cambio a "EN_TERRENO"
      manejarCambioEvento({ target: { value: idEventoSeleccionado } });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'Error al registrar salida' });
    }
  };



  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <h2>RF-P6-01: Registrar Salida de Kits de Bodega</h2>
      <p style={{ color: '#666' }}>Área Técnica - Entrega de kits antes de la transmisión</p>

      {mensaje.texto && (
        <div style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          borderRadius: '4px',
          backgroundColor: mensaje.tipo === 'error' ? '#ffebee' : '#e8f5e9',
          color: mensaje.tipo === 'error' ? '#c62828' : '#2e7d32',
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Selector de Evento */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Seleccionar Evento:
        </label>
        <select
          value={idEventoSeleccionado}
          onChange={manejarCambioEvento}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">-- Selecciona un evento --</option>
          {eventos.map((ev) => (
            <option key={ev.id_evento} value={ev.id_evento}>
              {`Evento #${ev.id_evento} - ${ev.tipo} (${new Date(ev.fecha).toLocaleDateString()})`}
            </option>
          ))}
        </select>
      </div>

      {cargando && <p>Cargando información del evento...</p>}

      {/* Lista de Kits asignados al evento */}
      {idEventoSeleccionado && !cargando && (
        <div>
          <h3>Kits Asignados al Evento</h3>
          {reservas.length === 0 ? (
            <p>No hay kits reservados para este evento.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reservas.map((reserva) => {
                const yaSalio = reserva.salida || reserva.kit.estado === 'EN_TERRENO';

                return (
                  <div
                    key={reserva.id_reserva}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      padding: '1rem',
                      backgroundColor: yaSalio ? '#f9f9f9' : '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{reserva.kit.nombre}</strong> (Nivel: {reserva.kit.nivel})
                        <div style={{ fontSize: '0.9rem', color: '#555', marginTop: '4px' }}>
                          Estado: <span style={{ fontWeight: 'bold', color: yaSalio ? '#d97706' : '#16a34a' }}>
                            {reserva.kit.estado ? reserva.kit.estado.replace(/_/g, ' ') : ''}
                          </span>
                        </div>
                      </div>

                      {yaSalio ? (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic', display: 'block' }}>
                            En terreno
                          </span>
                          {reserva.salida?.responsable?.trabajador?.nombre && (
                            <span style={{ fontSize: '0.85rem', color: '#1f2937', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                              Responsable: {reserva.salida.responsable.trabajador.nombre}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <select
                            value={responsables[reserva.id_reserva] || ''}
                            onChange={(e) => manejarCambioResponsable(reserva.id_reserva, e.target.value)}
                            style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
                          >
                            <option value="">-- Seleccionar Responsable --</option>
                            {personal.map((asig) => (
                              <option key={asig.id_asignacion} value={asig.id_asignacion}>
                                {asig.trabajador.nombre} ({asig.rol?.nombre_rol || 'Personal'})
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleRegistrarSalida(reserva.id_reserva)}
                            style={{
                              backgroundColor: '#2563eb',
                              color: 'white',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            Registrar Salida
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}