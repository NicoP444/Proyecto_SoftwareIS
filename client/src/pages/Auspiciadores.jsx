import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  registrarAuspiciador,
  obtenerAuspiciadores,
  modificarAuspiciador,
  eliminarAuspiciador
} from '../services/auspiciadorService';
import {
  obtenerAcuerdos,
  registrarCumplimiento,
  declararIncobrable
} from '../services/acuerdoService';

export default function Auspiciadores() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    rubro: '',
    contacto: '',
    telefono: '',
    id_dueno: 1
  });

  const [idEditando, setIdEditando] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [listaAcuerdos, setListaAcuerdos] = useState([]);
  const [cargandoAcuerdos, setCargandoAcuerdos] = useState(true);
  const [listaAuspiciadores, setListaAuspiciadores] = useState([]);

  // Estado para el menú desplegable de acciones
  const [menuAccionesAbierto, setMenuAccionesAbierto] = useState(null);

  const [modalClasificacion, setModalClasificacion] = useState({
    abierto: false,
    auspiciador: null,
    nuevoEstado: '',
    motivo: ''
  });

  const [modalCumplimiento, setModalCumplimiento] = useState({
    abierto: false,
    acuerdo: null,
    monto_recibido: '',
    fecha_recibida: new Date().toISOString().split('T')[0]
  });

  // Estado para el modal de Declarar Incobrable (RF-P4-06)
  const [modalIncobrable, setModalIncobrable] = useState({
    abierto: false,
    acuerdo: null,
    motivo: ''
  });

  // Estado para la burbuja/modal de ver motivo
  const [modalVerMotivo, setModalVerMotivo] = useState({
    abierto: false,
    auspiciador: '',
    motivo: ''
  });

  const cargarAcuerdos = async () => {
    try {
      setCargandoAcuerdos(true);
      const data = await obtenerAcuerdos();
      setListaAcuerdos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Aviso al cargar acuerdos:', error.message);
      setListaAcuerdos([]);
    } finally {
      setCargandoAcuerdos(false);
    }
  };

  const cargarAuspiciadores = async () => {
    try {
      const data = await obtenerAuspiciadores();
      setListaAuspiciadores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Aviso al cargar auspiciadores:', error.message);
      setListaAuspiciadores([]);
    }
  };

  useEffect(() => {
    cargarAcuerdos();
    cargarAuspiciadores();
  }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const iniciarEdicion = (item) => {
    setMostrarFormulario(true);
    setIdEditando(item.id_auspiciador || item.id);
    setFormData({
      nombre: item.nombre || '',
      rubro: item.rubro || '',
      contacto: item.contacto || '',
      telefono: item.telefono || '',
      id_dueno: item.id_dueno || 1
    });
    setMensaje('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setIdEditando(null);
    setFormData({
      nombre: '',
      rubro: '',
      contacto: '',
      telefono: '',
      id_dueno: 1
    });
    setMensaje('');
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setMensaje("Guardando...");

    try {
      if (idEditando) {
        await modificarAuspiciador(idEditando, formData);
        setMensaje("Auspiciador actualizado con éxito!");
      } else {
        await registrarAuspiciador(formData);
        setMensaje("Auspiciador registrado con éxito!");
      }

      cancelarEdicion();
      cargarAuspiciadores();
    } catch (error) {
      console.error(error);
      setMensaje(error.message || "Hubo un error al guardar.");
    }
  };

  const manejarEliminar = async (id) => {
    const confirmar = window.confirm("¿Seguro que deseas eliminar este auspiciador?");
    if (!confirmar) return;

    try {
      await eliminarAuspiciador(id);
      setMensaje("Auspiciador eliminado con éxito.");
      cargarAuspiciadores();
    } catch (error) {
      console.error(error);
      alert(error.message || "No se puede eliminar el auspiciador.");
    }
  };

  const abrirModalCambio = (item) => {
    const esNoConfiable = item.clasificacion === 'NO_CONFIABLE';
    setModalClasificacion({
      abierto: true,
      auspiciador: item,
      nuevoEstado: esNoConfiable ? 'CONFIABLE' : 'NO_CONFIABLE',
      motivo: item.motivo_clasificacion || ''
    });
  };

  const confirmarCambioClasificacion = async (e) => {
    e.preventDefault();
    const { auspiciador, nuevoEstado, motivo } = modalClasificacion;
    const id = auspiciador.id_auspiciador || auspiciador.id;

    try {
      const res = await fetch(`http://localhost:3000/api/auspiciadores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...auspiciador,
          clasificacion: nuevoEstado,
          motivo_clasificacion: motivo
        })
      });

      if (!res.ok) throw new Error('No se pudo actualizar');

      setMensaje(`Clasificación de ${auspiciador.nombre} cambiada a ${nuevoEstado}.`);
      setModalClasificacion({ abierto: false, auspiciador: null, nuevoEstado: '', motivo: '' });
      cargarAuspiciadores();
    } catch (error) {
      alert('Error al actualizar: ' + error.message);
    }
  };

  const abrirModalCumplimiento = (acuerdo) => {
    const totalPagado = (acuerdo.cumplimientos || []).reduce(
      (acc, c) => acc + Number(c.monto_recibido || 0),
      0
    );

    setModalCumplimiento({
      abierto: true,
      acuerdo,
      monto_recibido: totalPagado || acuerdo.monto_comprometido || '',
      fecha_recibida: new Date().toISOString().split('T')[0]
    });
  };

  const confirmarCumplimiento = async (e) => {
    e.preventDefault();
    const { acuerdo, monto_recibido, fecha_recibida } = modalCumplimiento;
    const id = acuerdo.id_acuerdo || acuerdo.id;

    try {
      await registrarCumplimiento(id, {
        monto_recibido: Number(monto_recibido),
        fecha_recibida
      });

      setModalCumplimiento({ abierto: false, acuerdo: null, monto_recibido: '', fecha_recibida: '' });
      cargarAcuerdos();
    } catch (error) {
      alert('Error al registrar cumplimiento: ' + error.message);
    }
  };

  // Funciones para RF-P4-06 (Declarar Incobrable)
  const abrirModalIncobrable = (acuerdo) => {
    setModalIncobrable({
      abierto: true,
      acuerdo,
      motivo: ''
    });
  };

  const confirmarIncobrable = async (e) => {
    e.preventDefault();
    const { acuerdo, motivo } = modalIncobrable;
    const id = acuerdo.id_acuerdo || acuerdo.id;

    try {
      await declararIncobrable(id, motivo);
      setModalIncobrable({ abierto: false, acuerdo: null, motivo: '' });
      cargarAcuerdos();
    } catch (error) {
      alert('Error al declarar incobrable: ' + error.message);
    }
  };

  // Conteo de acuerdos vencidos para el banner (RF-P4-05)
  const acuerdosVencidos = listaAcuerdos.filter((a) => a.estado === 'VENCIDO');

  return (
    <div style={{ padding: '10px 0', width: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Botones de acción */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => navigate('/auspiciadores/registrar-acuerdo')}
          style={{
            backgroundColor: '#0d6efd',
            color: 'white',
            padding: '9px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          + Registrar acuerdo
        </button>

        <button
          type="button"
          onClick={() => {
            if (mostrarFormulario) cancelarEdicion();
            setMostrarFormulario(!mostrarFormulario);
          }}
          style={{
            backgroundColor: mostrarFormulario ? '#dc3545' : '#198754',
            color: 'white',
            padding: '9px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {mostrarFormulario ? '✕ Cerrar formulario' : '+ Registrar auspiciador'}
        </button>
      </div>

      {/* BANNER DE ALERTA DE ACUERDOS VENCIDOS (RF-P4-05) */}
      {!mostrarFormulario && acuerdosVencidos.length > 0 && (
        <div style={{
          backgroundColor: '#fef2f2',
          borderLeft: '4px solid #ef4444',
          borderRadius: '8px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div>
            <strong style={{ color: '#991b1b', fontSize: '14px' }}>
              ⚠️ Alerta: Tienes {acuerdosVencidos.length} {acuerdosVencidos.length === 1 ? 'acuerdo vencido' : 'acuerdos vencidos'}
            </strong>
            <p style={{ margin: '3px 0 0 0', color: '#7f1d1d', fontSize: '13px' }}>
              Se ha superado la fecha comprometida sin registrar el pago completo del aporte.
            </p>
          </div>
        </div>
      )}

      {/* FORMULARIO DE REGISTRO / EDICIÓN */}
      {mostrarFormulario ? (
        <div>
          <div style={{
            marginBottom: '35px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '18px', fontSize: '20px' }}>
              {idEditando ? 'Modificar Auspiciador' : 'Registrar Auspiciador'}
            </h2>

            {mensaje && (
              <p style={{
                fontWeight: 'bold',
                color: mensaje.includes('éxito') || mensaje.includes('cambiada') ? '#198754' : '#dc3545',
                marginBottom: '15px'
              }}>
                {mensaje}
              </p>
            )}

            <form onSubmit={manejarEnvio} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500' }}>Nombre del Auspiciador:</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={manejarCambio}
                  required
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500' }}>Rubro:</label>
                <input
                  type="text"
                  name="rubro"
                  value={formData.rubro}
                  onChange={manejarCambio}
                  required
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500' }}>Nombre del Contacto:</label>
                <input
                  type="text"
                  name="contacto"
                  value={formData.contacto}
                  onChange={manejarCambio}
                  required
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500' }}>Teléfono:</label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={manejarCambio}
                  required
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: idEditando ? '#28a745' : '#0056b3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {idEditando ? 'Guardar Cambios' : 'Guardar Auspiciador'}
                </button>

                <button
                  type="button"
                  onClick={cancelarEdicion}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>
              Auspiciadores Registrados
            </h3>

            {listaAuspiciadores.length === 0 ? (
              <p style={{ color: '#64748b' }}>No hay auspiciadores registrados aún.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {listaAuspiciadores.map((item) => {
                  const id = item.id_auspiciador || item.id;
                  const esNoConfiable = item.clasificacion === 'NO_CONFIABLE';

                  return (
                    <div
                      key={id}
                      style={{
                        border: esNoConfiable ? '1px solid #fca5a5' : '1px solid #dee2e6',
                        borderRadius: '10px',
                        padding: '16px',
                        backgroundColor: esNoConfiable ? '#fffdfd' : '#ffffff',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{item.nombre}</h4>
                        
                        <button
                          type="button"
                          onClick={() => abrirModalCambio(item)}
                          title="Haz clic para cambiar la clasificación"
                          style={{
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '14px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            backgroundColor: esNoConfiable ? '#fee2e2' : '#dcfce7',
                            color: esNoConfiable ? '#991b1b' : '#166534',
                          }}
                        >
                          {esNoConfiable ? '⚠️ No confiable' : '✓ Confiable'}
                        </button>
                      </div>

                      <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Rubro:</strong> {item.rubro}</p>
                      <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Contacto:</strong> {item.contacto}</p>
                      <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Teléfono:</strong> {item.telefono}</p>

                      {item.motivo_clasificacion && (
                        <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                          <strong>Motivo:</strong> {item.motivo_clasificacion}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                        <button
                          type="button"
                          onClick={() => iniciarEdicion(item)}
                          style={{
                            backgroundColor: '#1b2a4a',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => manejarEliminar(id)}
                          style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TABLA DE ACUERDOS DE AUSPICIO */
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>Acuerdos de Auspicio</h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
              Acuerdos por evento, glosa, cumplimiento de aporte y acciones
            </p>
          </div>

          {cargandoAcuerdos ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>Cargando acuerdos...</p>
          ) : listaAcuerdos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 15px', color: '#64748b' }}>
              <p style={{ margin: 0 }}>No hay acuerdos registrados todavía.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 14px' }}>Auspiciador</th>
                    <th style={{ padding: '12px 14px' }}>Evento</th>
                    <th style={{ padding: '12px 14px' }}>Tipo de Pago</th>
                    <th style={{ padding: '12px 14px' }}>Glosa</th>
                    <th style={{ padding: '12px 14px' }}>Plazo</th>
                    <th style={{ padding: '12px 14px' }}>Estado</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {listaAcuerdos.map((item) => {
                    const id = item.id_acuerdo || item.id;
                    const nombreAuspiciador = item.auspiciador?.nombre || `Auspiciador #${item.id_auspiciador || '-'}`;
                    const nombreEvento = item.evento?.tipo || item.evento?.nombre || `Evento #${item.id_evento || '-'}`;
                    const tipoPago = item.tipo_aporte || item.tipo_pago || 'Aporte';
                    const detalleMonto = item.monto_comprometido || item.monto 
                      ? ` — $${Number(item.monto_comprometido || item.monto).toLocaleString('es-CL')}` 
                      : '';
                    const fechaPlazo = item.fecha_comprometida || item.fecha_limite 
                      ? new Date(item.fecha_comprometida || item.fecha_limite).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
                      : '--';

                    const totalPagado = (item.cumplimientos || []).reduce(
                      (acc, c) => acc + Number(c.monto_recibido || 0),
                      0
                    );

                    const estado = item.estado || 'PENDIENTE';
                    const esCumplido = estado === 'CUMPLIDO';
                    const esParcial = estado === 'PARCIAL';
                    const esVencido = estado === 'VENCIDO';
                    const esIncobrable = estado === 'INCOBRABLE';

                    const estiloBadge = esCumplido
                      ? { bg: '#dcfce7', color: '#15803d' }
                      : esParcial
                      ? { bg: '#fef3c7', color: '#b45309' }
                      : esVencido
                      ? { bg: '#fee2e2', color: '#b91c1c' }
                      : esIncobrable
                      ? { bg: '#f1f5f9', color: '#64748b' }
                      : { bg: '#e2e8f0', color: '#475569' };

                    return (
                      <tr key={id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: esVencido ? '#fffdfd' : 'transparent' }}>
                        <td style={{ padding: '14px', fontWeight: '600', color: '#1e293b' }}>
                          {nombreAuspiciador}
                        </td>
                        <td style={{ padding: '14px', color: '#334155' }}>
                          {nombreEvento}
                        </td>
                        <td style={{ padding: '14px', color: '#334155' }}>
                          {tipoPago}{detalleMonto}
                          {totalPagado > 0 && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              Recibido: ${totalPagado.toLocaleString('es-CL')}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px', color: '#64748b', maxWidth: '220px' }}>
                          {item.glosa || 'Sin glosa'}
                        </td>
                        <td style={{ padding: '14px', color: esVencido ? '#b91c1c' : '#334155', fontWeight: esVencido ? '600' : 'normal', whiteSpace: 'nowrap' }}>
                          {fechaPlazo}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{
                            backgroundColor: estiloBadge.bg,
                            color: estiloBadge.color,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'inline-block'
                          }}>
                            {estado}
                          </span>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'center', position: 'relative' }}>
                          {/* Caso 1: Vencido -> Botón "Gestionar" con menú desplegable */}
                          {esVencido && (
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <button
                                type="button"
                                onClick={() => setMenuAccionesAbierto(menuAccionesAbierto === id ? null : id)}
                                style={{
                                  backgroundColor: '#0d6efd',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '6px 14px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                Gestionar ▾
                              </button>

                              {menuAccionesAbierto === id && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '110%',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '8px',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
                                    border: '1px solid #e2e8f0',
                                    zIndex: 50,
                                    minWidth: '180px',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column'
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMenuAccionesAbierto(null);
                                      abrirModalCumplimiento(item);
                                    }}
                                    style={{
                                      padding: '10px 14px',
                                      textAlign: 'left',
                                      background: 'none',
                                      border: 'none',
                                      fontSize: '13px',
                                      color: '#1e293b',
                                      cursor: 'pointer',
                                      borderBottom: '1px solid #f1f5f9'
                                    }}
                                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
                                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                  >
                                    💵 Registrar Pago / Entrega
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMenuAccionesAbierto(null);
                                      abrirModalIncobrable(item);
                                    }}
                                    style={{
                                      padding: '10px 14px',
                                      textAlign: 'left',
                                      background: 'none',
                                      border: 'none',
                                      fontSize: '13px',
                                      color: '#dc2626',
                                      fontWeight: '500',
                                      cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#fef2f2')}
                                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                  >
                                    🚫 Declarar Incobrable
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Caso 2: Pendiente o Parcial -> Botón estándar Registrar Pago */}
                          {(estado === 'PENDIENTE' || estado === 'PARCIAL') && (
                            <button
                              type="button"
                              onClick={() => abrirModalCumplimiento(item)}
                              style={{
                                backgroundColor: '#0d6efd',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Registrar Pago / Entrega
                            </button>
                          )}

                          {/* Caso 3: Cumplido -> Botón Ver / Modificar */}
                          {esCumplido && (
                            <button
                              type="button"
                              onClick={() => abrirModalCumplimiento(item)}
                              style={{
                                backgroundColor: '#f8fafc',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Ver / Modificar Pago
                            </button>
                          )}

                          {/* Caso 4: Incobrable -> Botón Ver motivo con modal */}
                          {esIncobrable && (
                            <button
                              type="button"
                              onClick={() =>
                                setModalVerMotivo({
                                  abierto: true,
                                  auspiciador: nombreAuspiciador,
                                  motivo: item.motivo_incobrable || 'Sin motivo especificado.'
                                })
                              }
                              style={{
                                backgroundColor: '#f8fafc',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              📄 Ver motivo
                            </button>
                          )}
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

      {/* MODAL 1: CUMPLIMIENTO */}
      {modalCumplimiento.abierto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '6px', fontSize: '18px', color: '#0f172a' }}>
              Registrar Cumplimiento del Aporte
            </h3>
            
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Auspiciador: <strong>{modalCumplimiento.acuerdo?.auspiciador?.nombre || 'Acuerdo'}</strong> <br/>
              Monto Comprometido: <strong>${Number(modalCumplimiento.acuerdo?.monto_comprometido || 0).toLocaleString('es-CL')}</strong> ({modalCumplimiento.acuerdo?.tipo_aporte})
            </p>

            <form onSubmit={confirmarCumplimiento}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#334155' }}>
                  {modalCumplimiento.acuerdo?.tipo_aporte === 'DINERO' ? 'Monto Recibido ($):' : 'Valorización del Canje Recibido ($):'}
                </label>
                <input
                  type="number"
                  value={modalCumplimiento.monto_recibido}
                  onChange={(e) => setModalCumplimiento({ ...modalCumplimiento, monto_recibido: e.target.value })}
                  placeholder="Ej: 100000 (0 para restablecer)"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Ingresa 0 si deseas anular los registros de pago y restablecer el acuerdo.
                </span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#334155' }}>
                  Fecha de Recepción:
                </label>
                <input
                  type="date"
                  value={modalCumplimiento.fecha_recibida}
                  onChange={(e) => setModalCumplimiento({ ...modalCumplimiento, fecha_recibida: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalCumplimiento({ abierto: false, acuerdo: null, monto_recibido: '', fecha_recibida: '' })}
                  style={{
                    backgroundColor: '#e2e8f0',
                    color: '#334155',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#0d6efd',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Guardar Cumplimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CLASIFICACIÓN */}
      {modalClasificacion.abierto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '18px', color: '#0f172a' }}>
              Cambiar clasificación a: {modalClasificacion.nuevoEstado === 'NO_CONFIABLE' ? '⚠️ No Confiable' : '✓ Confiable'}
            </h3>
            
            <p style={{ margin: '0 0 14px 0', fontSize: '14px', color: '#64748b' }}>
              Auspiciador: <strong>{modalClasificacion.auspiciador?.nombre}</strong>
            </p>

            <form onSubmit={confirmarCambioClasificacion}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#334155' }}>
                Motivo del cambio (requerido):
              </label>
              <textarea
                value={modalClasificacion.motivo}
                onChange={(e) => setModalClasificacion({ ...modalClasificacion, motivo: e.target.value })}
                placeholder="Ej: Retraso reiterado de pagos o incumplimiento de aportes..."
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalClasificacion({ abierto: false, auspiciador: null, nuevoEstado: '', motivo: '' })}
                  style={{
                    backgroundColor: '#e2e8f0',
                    color: '#334155',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: modalClasificacion.nuevoEstado === 'NO_CONFIABLE' ? '#dc2626' : '#166534',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Guardar Clasificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DECLARAR INCOBRABLE (RF-P4-06) */}
      {modalIncobrable.abierto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px', color: '#b91c1c' }}>
              Declarar Aporte Incobrable
            </h3>
            
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#64748b' }}>
              Auspiciador: <strong>{modalIncobrable.acuerdo?.auspiciador?.nombre || 'Acuerdo'}</strong> <br/>
              Monto Comprometido no recuperado: <strong>${Number(modalIncobrable.acuerdo?.monto_comprometido || 0).toLocaleString('es-CL')}</strong>
            </p>

            <form onSubmit={confirmarIncobrable}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#334155' }}>
                  Motivo por el cual se da por perdido el cobro (requerido):
                </label>
                <textarea
                  value={modalIncobrable.motivo}
                  onChange={(e) => setModalIncobrable({ ...modalIncobrable, motivo: e.target.value })}
                  placeholder="Ej: Auspiciador no contesta correos ni llamadas tras reiteradas insistencias..."
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    boxSizing: 'border-box',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalIncobrable({ abierto: false, acuerdo: null, motivo: '' })}
                  style={{
                    backgroundColor: '#e2e8f0',
                    color: '#334155',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Confirmar Incobrable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: VER MOTIVO DE INCOBRABLE (BURBUJA MODAL) */}
      {modalVerMotivo.abierto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setModalVerMotivo({ abierto: false, auspiciador: '', motivo: '' })}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                Motivo de Incobrable
              </h3>
              <button
                type="button"
                onClick={() => setModalVerMotivo({ abierto: false, auspiciador: '', motivo: '' })}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px 6px'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b' }}>
              Auspiciador: <strong style={{ color: '#1e293b' }}>{modalVerMotivo.auspiciador}</strong>
            </p>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 16px',
                fontSize: '14px',
                color: '#334155',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                marginBottom: '20px'
              }}
            >
              "{modalVerMotivo.motivo}"
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setModalVerMotivo({ abierto: false, auspiciador: '', motivo: '' })}
                style={{
                  backgroundColor: '#0d6efd',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}