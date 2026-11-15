import { useState, useEffect } from 'react';
import { 
  FaPlus, FaVideo, FaSlidersH, FaMicrophone, FaDesktop, 
  FaExclamationTriangle, FaBoxOpen 
} from 'react-icons/fa';
import {
  obtenerEquipos,
  registrarEquipo,
  actualizarEquipo,
  darDeBajaEquipo,
  eliminarEquipo
} from '../services/equipoService';
import { kitClientService } from '../services/kit.service';

export default function Equipos() {
  const [activeTab, setActiveTab] = useState('KITS');

  // --- ESTADOS DE EQUIPOS / INVENTARIO ---
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'CAMARA',
    marca: '',
    modelo: '',
    fecha_compra: new Date().toISOString().split('T')[0],
    valor_compra: '',
    id_jefe: 1
  });

  const [listaEquipos, setListaEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [equipoEditando, setEquipoEditando] = useState(null);
  const [equipoBaja, setEquipoBaja] = useState(null);
  const [motivoBaja, setMotivoBaja] = useState('');

  // --- ESTADOS DE KITS ---
  const [kits, setKits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombreKit, setNombreKit] = useState('');
  const [nivelKit, setNivelKit] = useState('BASICO');
  const [recargoPct, setRecargoPct] = useState(0);

  // Selección independiente por categoría para CREAR
  const [camaraSeleccionada, setCamaraSeleccionada] = useState('');
  const [tripodeSeleccionado, setTripodeSeleccionado] = useState('');
  const [microfonoSeleccionado, setMicrofonoSeleccionado] = useState('');
  const [switchSeleccionado, setSwitchSeleccionado] = useState('');

  const [errorKit, setErrorKit] = useState('');
  const [loadingKit, setLoadingKit] = useState(false);

  // --- ESTADOS PARA MODIFICAR KIT (RF-P5-05) ---
  const [kitEditando, setKitEditando] = useState(null);
  const [nombreEditKit, setNombreEditKit] = useState('');
  const [nivelEditKit, setNivelEditKit] = useState('BASICO');
  const [recargoEditPct, setRecargoEditPct] = useState(0);
  const [camaraEdit, setCamaraEdit] = useState('');
  const [tripodeEdit, setTripodeEdit] = useState('');
  const [microfonoEdit, setMicrofonoEdit] = useState('');
  const [switchEdit, setSwitchEdit] = useState('');
  const [errorEditKit, setErrorEditKit] = useState('');
  const [loadingEditKit, setLoadingEditKit] = useState(false);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [dataEquipos, dataKits] = await Promise.all([
        obtenerEquipos(),
        kitClientService.obtenerKits()
      ]);
      setListaEquipos(Array.isArray(dataEquipos) ? dataEquipos : []);
      setKits(Array.isArray(dataKits) ? dataKits : []);
    } catch (error) {
      console.warn('Error al cargar datos:', error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const getIconoCategoria = (categoria) => {
    switch (categoria) {
      case 'CAMARA': return <FaVideo className="text-blue-500" />;
      case 'TRIPODE': return <FaSlidersH className="text-gray-500" />;
      case 'MICROFONO': return <FaMicrophone className="text-indigo-500" />;
      case 'SWITCH_VIDEO': return <FaDesktop className="text-slate-700" />;
      default: return <FaBoxOpen />;
    }
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setMensaje('Registrando equipo...');
    try {
      await registrarEquipo({ ...formData, valor_compra: Number(formData.valor_compra) });
      alert('Equipo registrado con éxito en inventario');
      setMostrarFormulario(false);
      setFormData({
        nombre: '',
        categoria: 'CAMARA',
        marca: '',
        modelo: '',
        fecha_compra: new Date().toISOString().split('T')[0],
        valor_compra: '',
        id_jefe: 1
      });
      setMensaje('');
      cargarDatos();
    } catch (error) {
      setMensaje(error.message || 'Error al registrar el equipo.');
    }
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    try {
      await actualizarEquipo(equipoEditando.codigo, {
        nombre: equipoEditando.nombre,
        categoria: equipoEditando.categoria,
        marca: equipoEditando.marca || null,
        modelo: equipoEditando.modelo || null,
        fecha_compra: equipoEditando.fecha_compra,
        valor_compra: Number(equipoEditando.valor_compra)
      });
      setEquipoEditando(null);
      await cargarDatos();
    } catch (error) {
      alert(error.message || 'Error al actualizar el equipo.');
    }
  };

  const confirmarBaja = async (e) => {
    e.preventDefault();
    if (!motivoBaja.trim()) {
      alert('Debe indicar un motivo para dar de baja el equipo.');
      return;
    }
    try {
      const resp = await darDeBajaEquipo(equipoBaja.codigo, motivoBaja);
      if (resp?.sinHistorial && window.confirm('Deseas eliminarlo definitivamente?')) {
        await eliminarEquipo(equipoBaja.codigo);
      }
      setEquipoBaja(null);
      setMotivoBaja('');
      await cargarDatos();
    } catch (error) {
      alert(error.message || 'Error al procesar la baja.');
    }
  };

  const handleSubmitCrearKit = async (e) => {
    e.preventDefault();
    setErrorKit('');
    setLoadingKit(true);
    try {
      const equiposArray = [
        camaraSeleccionada,
        tripodeSeleccionado,
        microfonoSeleccionado,
        switchSeleccionado
      ].filter(Boolean);

      const payload = {
        nombre: nombreKit,
        nivel: nivelKit,
        recargo_pct: Number(recargoPct),
        equipos: equiposArray
      };

      const resultado = await kitClientService.crearKit(payload);
      alert(resultado.mensaje || 'Kit creado exitosamente');
      setIsModalOpen(false);
      
      setNombreKit('');
      setNivelKit('BASICO');
      setRecargoPct(0);
      setCamaraSeleccionada('');
      setTripodeSeleccionado('');
      setMicrofonoSeleccionado('');
      setSwitchSeleccionado('');
      
      await cargarDatos();
    } catch (err) {
      setErrorKit(err.message || 'Error al crear el kit');
    } finally {
      setLoadingKit(false);
    }
  };

  // --- LÓGICA DE MODIFICAR KIT (RF-P5-05) ---
  const iniciarEdicionKit = (kit) => {
    setKitEditando(kit);
    setNombreEditKit(kit.nombre);
    setNivelEditKit(kit.nivel);
    setRecargoEditPct(kit.recargo_pct);
    setErrorEditKit('');

    const camara = kit.equipos?.find(e => e.categoria === 'CAMARA')?.codigo || '';
    const tripode = kit.equipos?.find(e => e.categoria === 'TRIPODE')?.codigo || '';
    const microfono = kit.equipos?.find(e => e.categoria === 'MICROFONO')?.codigo || '';
    const sw = kit.equipos?.find(e => e.categoria === 'SWITCH_VIDEO')?.codigo || '';

    setCamaraEdit(camara);
    setTripodeEdit(tripode);
    setMicrofonoEdit(microfono);
    setSwitchEdit(sw);
  };

  const handleSubmitModificarKit = async (e) => {
    e.preventDefault();
    setErrorEditKit('');
    setLoadingEditKit(true);

    try {
      const equiposArray = [camaraEdit, tripodeEdit, microfonoEdit, switchEdit].filter(Boolean);

      const payload = {
        nombre: nombreEditKit,
        nivel: nivelEditKit,
        recargo_pct: Number(recargoEditPct),
        equipos: equiposArray
      };

      const resultado = await kitClientService.actualizarKit(kitEditando.id_kit, payload);
      alert(resultado.mensaje || 'Kit actualizado exitosamente');
      setKitEditando(null);
      await cargarDatos();
    } catch (err) {
      setErrorEditKit(err.message || 'Error al actualizar el kit');
    } finally {
      setLoadingEditKit(false);
    }
  };

  // --- LÓGICA DE ELIMINAR KIT (RF-P5-06) ---
  const manejarEliminarKit = async (idKit, nombreKit) => {
    if (!window.confirm(`Estás seguro de que deseas eliminar el kit "${nombreKit}"? Sus equipos pasarán a ser repuestos.`)) {
      return;
    }
    try {
      const resultado = await kitClientService.eliminarKit(idKit);
      alert(resultado.mensaje || 'Kit eliminado con éxito');
      await cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al eliminar el kit');
    }
  };

  const equiposOperativos = listaEquipos.filter(
    eq => eq.estado?.toUpperCase() === 'OPERATIVO'
  );

  const camerasDisponibles = equiposOperativos.filter(eq => eq.categoria?.toUpperCase() === 'CAMARA');
  const tripodesDisponibles = equiposOperativos.filter(eq => eq.categoria?.toUpperCase() === 'TRIPODE');
  const microfonosDisponibles = equiposOperativos.filter(eq => eq.categoria?.toUpperCase() === 'MICROFONO');
  const switchesDisponibles = equiposOperativos.filter(eq => eq.categoria?.toUpperCase() === 'SWITCH_VIDEO');

  return (
    <div style={{ padding: '10px 0', width: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* PESTAÑAS SUPERIORES Y BOTÓN DE ACCIÓN */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('KITS')}
            style={{
              padding: '9px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: activeTab === 'KITS' ? '#334155' : '#e0f2fe',
              color: activeTab === 'KITS' ? '#ffffff' : '#0369a1',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            KITS
          </button>
          <button
            onClick={() => setActiveTab('EQUIPOS')}
            style={{
              padding: '9px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: activeTab === 'EQUIPOS' ? '#334155' : '#e0f2fe',
              color: activeTab === 'EQUIPOS' ? '#ffffff' : '#0369a1',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            EQUIPOS
          </button>
        </div>

        {activeTab === 'KITS' ? (
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#0f172a',
              color: 'white',
              padding: '10px 18px',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <span style={{ backgroundColor: 'white', color: '#0f172a', borderRadius: '50%', padding: '2px 6px', fontSize: '11px' }}>
              +
            </span>
            <span>Crear kit</span>
          </button>
        ) : activeTab === 'EQUIPOS' ? (
          <button
            type="button"
            onClick={() => {
              setMostrarFormulario(true);
              setMensaje('');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#0f172a',
              color: 'white',
              padding: '10px 18px',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <span style={{ backgroundColor: 'white', color: '#0f172a', borderRadius: '50%', padding: '2px 6px', fontSize: '11px' }}>
              +
            </span>
            <span>Registrar nuevo equipo</span>
          </button>
        ) : null}
      </div>

      {/* ================= VISTA KITS ================= */}
      {activeTab === 'KITS' && (
        <div>
          {kits.length === 0 ? (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0', color: '#64748b' }}>
              <FaBoxOpen style={{ fontSize: '40px', marginBottom: '12px', color: '#94a3b8' }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#1e293b' }}>No hay kits creados</h3>
              <p style={{ margin: 0, fontSize: '13px' }}>Haz clic en "+ Crear kit" para armar el primer kit con equipos operativos del inventario.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {kits.map((kit) => (
                <div key={kit.id_kit} style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>{kit.nombre}</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                        {kit.nivel} · Recargo: {kit.recargo_pct}%
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => iniciarEdicionKit(kit)}
                        style={{ padding: '5px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: '#1e293b' }}
                      >
                        Modificar
                      </button>
                      <button
                        onClick={() => manejarEliminarKit(kit.id_kit, kit.nombre)}
                        style={{ padding: '5px 12px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: '#991b1b' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '16px 0' }}>
                    {kit.equipos?.map((eq, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '8px' }}>
                        <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          {getIconoCategoria(eq.categoria)}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eq.nombre}</p>
                          <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'capitalize' }}>{eq.categoria?.toLowerCase().replace('_', ' ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                      {kit.estado || 'DISPONIBLE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= VISTA EQUIPOS / INVENTARIO ================= */}
      {activeTab === 'EQUIPOS' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>Inventario de Equipos</h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
              Listado de equipos registrados, código correlativo y estado de asignación
            </p>
          </div>

          {cargando ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>Cargando inventario...</p>
          ) : listaEquipos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 15px', color: '#64748b' }}>
              <p style={{ margin: 0 }}>No hay equipos registrados en el inventario.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 14px' }}>Código</th>
                    <th style={{ padding: '12px 14px' }}>Equipo</th>
                    <th style={{ padding: '12px 14px' }}>Categoría</th>
                    <th style={{ padding: '12px 14px' }}>Marca / Modelo</th>
                    <th style={{ padding: '12px 14px' }}>Fecha Compra</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Valor Compra</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Estado</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Kit</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {listaEquipos.map((eq) => {
                    const fecha = eq.fecha_compra ? new Date(eq.fecha_compra).toLocaleDateString('es-CL') : '--';
                    const esBaja = eq.estado === 'DADO_DE_BAJA';
                    return (
                      <tr key={eq.codigo} style={{ borderBottom: '1px solid #f1f5f9', opacity: esBaja ? 0.65 : 1 }}>
                        <td style={{ padding: '14px', fontWeight: '700', color: '#0f172a' }}>{eq.codigo}</td>
                        <td style={{ padding: '14px', fontWeight: '600', color: '#1e293b' }}>{eq.nombre}</td>
                        <td style={{ padding: '14px', color: '#475569' }}>{eq.categoria}</td>
                        <td style={{ padding: '14px', color: '#64748b' }}>{eq.marca || '-'} {eq.modelo ? `(${eq.modelo})` : ''}</td>
                        <td style={{ padding: '14px', color: '#475569' }}>{fecha}</td>
                        <td style={{ padding: '14px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>${Number(eq.valor_compra || 0).toLocaleString('es-CL')}</td>
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <span style={{
                            backgroundColor: esBaja ? '#f1f5f9' : eq.estado === 'OPERATIVO' ? '#dcfce7' : '#fee2e2',
                            color: esBaja ? '#475569' : eq.estado === 'OPERATIVO' ? '#166534' : '#991b1b',
                            padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600'
                          }}>
                            {eq.estado}
                          </span>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'center', color: eq.kit ? '#0f172a' : '#64748b' }}>
                          {eq.kit?.nombre || eq.kit || 'Repuesto (Sin kit)'}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setEquipoEditando(eq)}
                              style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#1e293b' }}
                            >
                              Modificar
                            </button>
                            {!esBaja && (
                              <button
                                type="button"
                                onClick={() => setEquipoBaja(eq)}
                                style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#991b1b' }}
                              >
                                Dar de baja
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL REGISTRAR NUEVO EQUIPO ================= */}
      {mostrarFormulario && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '640px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <h2 style={{ marginTop: 0, marginBottom: '6px', fontSize: '18px', color: '#1e293b' }}>
              Registrar Equipo en Inventario
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              El sistema generará automáticamente el código único según la categoría y asignará el estado Operativo.
            </p>

            {mensaje && (
              <p style={{ fontWeight: '600', color: mensaje.includes('éxito') ? '#166534' : '#dc2626', marginBottom: '14px', fontSize: '14px' }}>
                {mensaje}
              </p>
            )}

            <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Nombre del equipo:</label>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Ej: Sony Alpha 7 IV"
                  value={formData.nombre}
                  onChange={manejarCambio}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Categoría:</label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={manejarCambio}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="CAMARA">CAMARA</option>
                    <option value="TRIPODE">TRIPODE</option>
                    <option value="MICROFONO">MICROFONO</option>
                    <option value="SWITCH_VIDEO">SWITCH_VIDEO</option>
                    <option value="OTRO">OTRO</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Marca:</label>
                  <input
                    type="text"
                    name="marca"
                    placeholder="Ej: Sony"
                    value={formData.marca}
                    onChange={manejarCambio}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Modelo:</label>
                  <input
                    type="text"
                    name="modelo"
                    placeholder="Ej: ILCE-7M4"
                    value={formData.modelo}
                    onChange={manejarCambio}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Fecha de compra:</label>
                  <input
                    type="date"
                    name="fecha_compra"
                    value={formData.fecha_compra}
                    onChange={manejarCambio}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Valor de compra ($):</label>
                <input
                  type="number"
                  name="valor_compra"
                  placeholder="Ej: 1800000"
                  value={formData.valor_compra}
                  onChange={manejarCambio}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                >
                  Guardar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODALES DE EQUIPOS ================= */}
      {equipoEditando && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '6px', fontSize: '18px', color: '#1e293b' }}>Modificar Equipo: {equipoEditando.codigo}</h2>
            <form onSubmit={guardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" name="nombre" value={equipoEditando.nombre} onChange={(e) => setEquipoEditando({ ...equipoEditando, nombre: e.target.value })} required style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setEquipoEditando(null)} style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 18px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {equipoBaja && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '460px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '6px', fontSize: '18px', color: '#991b1b' }}>Dar de baja: {equipoBaja.codigo}</h2>
            <form onSubmit={confirmarBaja} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea rows="3" value={motivoBaja} onChange={(e) => setMotivoBaja(e.target.value)} placeholder="Motivo de la baja..." required style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setEquipoBaja(null)} style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 18px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Confirmar Baja</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CREAR KIT ================= */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '640px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <h2 style={{ marginTop: 0, marginBottom: '6px', fontSize: '18px', color: '#1e293b' }}>Crear Nuevo Kit</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Selecciona obligatoriamente 1 equipo operativo de cada categoría requerida.
            </p>

            {errorKit && (
              <div style={{ marginBottom: '14px', padding: '10px 14px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaExclamationTriangle />
                <span>{errorKit}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCrearKit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Nombre del Kit:</label>
                <input
                  type="text"
                  maxLength={60}
                  required
                  value={nombreKit}
                  onChange={(e) => setNombreKit(e.target.value)}
                  placeholder="Ej. Kit Audiovisual Pro"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Nivel:</label>
                  <select
                    value={nivelKit}
                    onChange={(e) => setNivelKit(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="BASICO">Básico</option>
                    <option value="ESTANDAR">Estándar</option>
                    <option value="ALTA_GAMA">Alta Gama</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Recargo (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="999.99"
                    step="0.01"
                    value={recargoPct}
                    onChange={(e) => setRecargoPct(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* 4 APARTADOS INDEPENDIENTES POR CATEGORÍA */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                
                {/* 1. CÁMARA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>Cámara (Obligatorio):</label>
                  <select
                    value={camaraSeleccionada}
                    onChange={(e) => setCamaraSeleccionada(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Seleccione Cámara --</option>
                    {camerasDisponibles.map(eq => (
                      <option key={eq.codigo} value={eq.codigo}>
                        {eq.codigo} - {eq.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. TRÍPODE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>Trípode (Obligatorio):</label>
                  <select
                    value={tripodeSeleccionado}
                    onChange={(e) => setTripodeSeleccionado(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Seleccione Trípode --</option>
                    {tripodesDisponibles.map(eq => (
                      <option key={eq.codigo} value={eq.codigo}>
                        {eq.codigo} - {eq.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. MICRÓFONO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>Micrófono (Obligatorio):</label>
                  <select
                    value={microfonoSeleccionado}
                    onChange={(e) => setMicrofonoSeleccionado(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Seleccione Micrófono --</option>
                    {microfonosDisponibles.map(eq => (
                      <option key={eq.codigo} value={eq.codigo}>
                        {eq.codigo} - {eq.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. SWITCH DE VIDEO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>Switch de video (Obligatorio):</label>
                  <select
                    value={switchSeleccionado}
                    onChange={(e) => setSwitchSeleccionado(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Seleccione Switch --</option>
                    {switchesDisponibles.map(eq => (
                      <option key={eq.codigo} value={eq.codigo}>
                        {eq.codigo} - {eq.nombre}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingKit}
                  style={{ padding: '8px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                >
                  {loadingKit ? 'Guardando...' : 'Guardar Kit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL MODIFICAR KIT (RF-P5-05) ================= */}
      {kitEditando && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '640px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <h2 style={{ marginTop: 0, marginBottom: '6px', fontSize: '18px', color: '#1e293b' }}>Modificar Kit: {kitEditando.nombre}</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Actualiza la información o los equipos del kit.
            </p>

            {kitEditando.estado === 'EN_TERRENO' && (
              <div style={{ marginBottom: '14px', padding: '10px 14px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '13px', borderRadius: '8px' }}>
                Este kit está en terreno, por lo que no se permite cambiar su composición de equipos.
              </div>
            )}

            {errorEditKit && (
              <div style={{ marginBottom: '14px', padding: '10px 14px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaExclamationTriangle />
                <span>{errorEditKit}</span>
              </div>
            )}

            <form onSubmit={handleSubmitModificarKit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Nombre del Kit:</label>
                <input
                  type="text"
                  maxLength={60}
                  required
                  value={nombreEditKit}
                  onChange={(e) => setNombreEditKit(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Nivel:</label>
                  <select
                    value={nivelEditKit}
                    onChange={(e) => setNivelEditKit(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="BASICO">Básico</option>
                    <option value="ESTANDAR">Estándar</option>
                    <option value="ALTA_GAMA">Alta Gama</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Recargo (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="999.99"
                    step="0.01"
                    value={recargoEditPct}
                    onChange={(e) => setRecargoEditPct(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>Cámara:</label>
                  <select
                    value={camaraEdit}
                    onChange={(e) => setCamaraEdit(e.target.value)}
                    disabled={kitEditando.estado === 'EN_TERRENO'}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: kitEditando.estado === 'EN_TERREno' ? '#f1f5f9' : '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Seleccione Cámara --</option>
                    {listaEquipos.filter(eq => eq.categoria === 'CAMARA' && (eq.estado === 'OPERATIVO' || eq.codigo === camaraEdit)).map(eq => (
                      <option key={eq.codigo} value={eq.codigo}>{eq.codigo} - {eq.nombre}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>Trípode:</label>
                  <select
                    value={tripodeEdit}
                    onChange={(e) => setTripodeEdit(e.target.value)}
                    disabled={kitEditando.estado === 'EN_TERRENO'}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: kitEditando.estado === 'EN_TERRENO' ? '#f1f5f9' : '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Seleccione Trípode --</option>
                    {listaEquipos.filter(eq => eq.categoria === 'TRIPODE' && (eq.estado === 'OPERATIVO' || eq.codigo === tripodeEdit)).map(eq => (
                      <option key={eq.codigo} value={eq.codigo}>{eq.codigo} - {eq.nombre}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>Micrófono:</label>
                  <select
                    value={microfonoEdit}
                    onChange={(e) => setMicrofonoEdit(e.target.value)}
                    disabled={kitEditando.estado === 'EN_TERRENO'}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: kitEditando.estado === 'EN_TERRENO' ? '#f1f5f9' : '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Seleccione Micrófono --</option>
                    {listaEquipos.filter(eq => eq.categoria === 'MICROFONO' && (eq.estado === 'OPERATIVO' || eq.codigo === microfonoEdit)).map(eq => (
                      <option key={eq.codigo} value={eq.codigo}>{eq.codigo} - {eq.nombre}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>Switch de video:</label>
                  <select
                    value={switchEdit}
                    onChange={(e) => setSwitchEdit(e.target.value)}
                    disabled={kitEditando.estado === 'EN_TERRENO'}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: kitEditando.estado === 'EN_TERRENO' ? '#f1f5f9' : '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Seleccione Switch --</option>
                    {listaEquipos.filter(eq => eq.categoria === 'SWITCH_VIDEO' && (eq.estado === 'OPERATIVO' || eq.codigo === switchEdit)).map(eq => (
                      <option key={eq.codigo} value={eq.codigo}>{eq.codigo} - {eq.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setKitEditando(null)}
                  style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingEditKit}
                  style={{ padding: '8px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                >
                  {loadingEditKit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}