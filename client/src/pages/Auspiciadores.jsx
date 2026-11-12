import { useState, useEffect, useMemo } from 'react';
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
  declararIncobrable,
  modificarAcuerdo,
  eliminarAcuerdo
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

  // Pestaña activa: 'acuerdos' (gestión) o 'reporte' (RF-P4-08 solo lectura)
  const [pestanaActiva, setPestanaActiva] = useState('acuerdos');

  // Filtros de mes y año para el reporte (por defecto mes y año actual)
  const fechaActual = new Date();
  const [filtroMes, setFiltroMes] = useState(String(fechaActual.getMonth() + 1));
  const [filtroAnio, setFiltroAnio] = useState(String(fechaActual.getFullYear()));

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

  // Estado para el modal de Modificar Acuerdo
  const [modalEditarAcuerdo, setModalEditarAcuerdo] = useState({
    abierto: false,
    id_acuerdo: null,
    glosa: '',
    tipo_aporte: 'DINERO',
    monto_comprometido: '',
    descripcion_canje: '',
    cant_menciones: '',
    fecha_comprometida: ''
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

  // Corrección aquí: se reemplazó el fetch con localhost:3000 por modificarAuspiciador
  const confirmarCambioClasificacion = async (e) => {
    e.preventDefault();
    const { auspiciador, nuevoEstado, motivo } = modalClasificacion;
    const id = auspiciador.id_auspiciador || auspiciador.id;

    try {
      await modificarAuspiciador(id, {
        ...auspiciador,
        clasificacion: nuevoEstado,
        motivo_clasificacion: motivo
      });

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

  // Funciones para Editar y Eliminar Acuerdo
  const abrirModalEditarAcuerdo = (acuerdo) => {
    const fechaFormat = acuerdo.fecha_comprometida
      ? new Date(acuerdo.fecha_comprometida).toISOString().split('T')[0]
      : '';

    setModalEditarAcuerdo({
      abierto: true,
      id_acuerdo: acuerdo.id_acuerdo || acuerdo.id,
      glosa: acuerdo.glosa || '',
      tipo_aporte: acuerdo.tipo_aporte || 'DINERO',
      monto_comprometido: acuerdo.monto_comprometido || '',
      descripcion_canje: acuerdo.descripcion_canje || '',
      cant_menciones: acuerdo.cant_menciones || '',
      fecha_comprometida: fechaFormat
    });
  };

  const confirmarEdicionAcuerdo = async (e) => {
    e.preventDefault();
    try {
      await modificarAcuerdo(modalEditarAcuerdo.id_acuerdo, {
        glosa: modalEditarAcuerdo.glosa,
        tipo_aporte: modalEditarAcuerdo.tipo_aporte,
        monto_comprometido: Number(modalEditarAcuerdo.monto_comprometido),
        descripcion_canje: modalEditarAcuerdo.descripcion_canje,
        cant_menciones: modalEditarAcuerdo.cant_menciones ? Number(modalEditarAcuerdo.cant_menciones) : null,
        fecha_comprometida: modalEditarAcuerdo.fecha_comprometida
      });

      setModalEditarAcuerdo({
        abierto: false,
        id_acuerdo: null,
        glosa: '',
        tipo_aporte: 'DINERO',
        monto_comprometido: '',
        descripcion_canje: '',
        cant_menciones: '',
        fecha_comprometida: ''
      });
      cargarAcuerdos();
    } catch (error) {
      alert('Error al modificar acuerdo: ' + error.message);
    }
  };

  const manejarEliminarAcuerdo = async (idAcuerdo) => {
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar este acuerdo? Se borrarán también los registros de pago asociados.");
    if (!confirmar) return;

    try {
      await eliminarAcuerdo(idAcuerdo);
      cargarAcuerdos();
    } catch (error) {
      alert('Error al eliminar acuerdo: ' + error.message);
    }
  };

  // Conteo de acuerdos vencidos para el banner (RF-P4-05)
  const acuerdosVencidos = listaAcuerdos.filter((a) => a.estado === 'VENCIDO');

  // ---------- LÓGICA DE REPORTE CONSOLIDADO (RF-P4-08) ----------
  const reporteConsolidado = useMemo(() => {
    // 1. Filtrar acuerdos por mes y año según fecha_comprometida
    const acuerdosFiltrados = listaAcuerdos.filter((acuerdo) => {
      const fecha = acuerdo.fecha_comprometida ? new Date(acuerdo.fecha_comprometida) : null;
      if (!fecha) return false;

      const coincideAnio = filtroAnio === 'TODOS' || fecha.getFullYear() === Number(filtroAnio);
      const coincideMes = filtroMes === 'TODOS' || fecha.getMonth() + 1 === Number(filtroMes);

      return coincideAnio && coincideMes;
    });

    // 2. Totales generales del periodo
    let totalComprometido = 0;
    let totalCumplido = 0;
    let totalVencido = 0;
    let totalIncobrable = 0;

    // 3. Agrupación por auspiciador
    const mapaAuspiciadores = {};

    acuerdosFiltrados.forEach((acuerdo) => {
      const idAusp = acuerdo.id_auspiciador || (acuerdo.auspiciador ? acuerdo.auspiciador.id_auspiciador : 'sin_id');
      const nombreAusp = acuerdo.auspiciador?.nombre || `Auspiciador #${idAusp}`;
      const clasificacion = acuerdo.auspiciador?.clasificacion || 'CONFIABLE';

      if (!mapaAuspiciadores[idAusp]) {
        mapaAuspiciadores[idAusp] = {
          id: idAusp,
          nombre: nombreAusp,
          clasificacion,
          comprometido: 0,
          cumplido: 0,
          vencido: 0,
          incobrable: 0,
          totalAcuerdos: 0,
        };
      }

      const monto = Number(acuerdo.monto_comprometido || 0);
      const totalPagado = (acuerdo.cumplimientos || []).reduce(
        (acc, c) => acc + Number(c.monto_recibido || 0),
        0
      );

      mapaAuspiciadores[idAusp].comprometido += monto;
      totalComprometido += monto;
      mapaAuspiciadores[idAusp].totalAcuerdos += 1;

      if (acuerdo.estado === 'CUMPLIDO') {
        mapaAuspiciadores[idAusp].cumplido += monto;
        totalCumplido += monto;
      } else if (acuerdo.estado === 'PARCIAL') {
        mapaAuspiciadores[idAusp].cumplido += totalPagado;
        totalCumplido += totalPagado;
      } else if (acuerdo.estado === 'VENCIDO') {
        const saldoVencido = monto - totalPagado;
        mapaAuspiciadores[idAusp].vencido += saldoVencido > 0 ? saldoVencido : monto;
        totalVencido += saldoVencido > 0 ? saldoVencido : monto;
        if (totalPagado > 0) {
          mapaAuspiciadores[idAusp].cumplido += totalPagado;
          totalCumplido += totalPagado;
        }
      } else if (acuerdo.estado === 'INCOBRABLE') {
        mapaAuspiciadores[idAusp].incobrable += monto;
        totalIncobrable += monto;
      }
    });

    return {
      totales: {
        totalComprometido,
        totalCumplido,
        totalVencido,
        totalIncobrable,
        cantidadAcuerdos: acuerdosFiltrados.length,
      },
      filas: Object.values(mapaAuspiciadores),
    };
  }, [listaAcuerdos, filtroMes, filtroAnio]);

  return (
    <div style={{ padding: '10px 0', width: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Botones de acción principales */}
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

      {/* FORMULARIO DE REGISTRO / EDICIÓN AUSPICIADOR */}
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
        /* VISTA PRINCIPAL CON PESTAÑAS (ACUERDOS VS REPORTE RF-P4-08) */
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          border: '1px solid #f1f5f9'
        }}>
          {/* BARRA DE PESTAÑAS */}
          <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', marginBottom: '22px' }}>
            <button
              type="button"
              onClick={() => setPestanaActiva('acuerdos')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: pestanaActiva === 'acuerdos' ? '3px solid #0d6efd' : '3px solid transparent',
                padding: '10px 16px',
                fontSize: '15px',
                fontWeight: pestanaActiva === 'acuerdos' ? '700' : '500',
                color: pestanaActiva === 'acuerdos' ? '#0d6efd' : '#64748b',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
               Acuerdos de Auspicio
            </button>

            <button
              type="button"
              onClick={() => setPestanaActiva('reporte')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: pestanaActiva === 'reporte' ? '3px solid #0d6efd' : '3px solid transparent',
                padding: '10px 16px',
                fontSize: '15px',
                fontWeight: pestanaActiva === 'reporte' ? '700' : '500',
                color: pestanaActiva === 'reporte' ? '#0d6efd' : '#64748b',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
               Reporte Mensual de Aportes
            </button>
          </div>

          {/* ======================================================== */}
          {/* PESTAÑA 1: GESTIÓN OPERATIVA DE ACUERDOS                */}
          {/* ======================================================== */}
          {pestanaActiva === 'acuerdos' ? (
            <div>
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
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <button
                                  type="button"
                                  onClick={() => setMenuAccionesAbierto(menuAccionesAbierto === id ? null : id)}
                                  style={{
                                    backgroundColor: esCumplido ? '#f8fafc' : esIncobrable ? '#f1f5f9' : '#0d6efd',
                                    color: esCumplido ? '#475569' : esIncobrable ? '#64748b' : '#ffffff',
                                    border: esCumplido || esIncobrable ? '1px solid #cbd5e1' : 'none',
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
                                      minWidth: '190px',
                                      overflow: 'hidden',
                                      display: 'flex',
                                      flexDirection: 'column'
                                    }}
                                  >
                                    {!esIncobrable && (
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
                                         {esCumplido ? 'Ver / Modificar Pago' : 'Registrar Pago / Entrega'}
                                      </button>
                                    )}

                                    {esIncobrable && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMenuAccionesAbierto(null);
                                          setModalVerMotivo({
                                            abierto: true,
                                            auspiciador: nombreAuspiciador,
                                            motivo: item.motivo_incobrable || 'Sin motivo especificado.'
                                          });
                                        }}
                                        style={{
                                          padding: '10px 14px',
                                          textAlign: 'left',
                                          background: 'none',
                                          border: 'none',
                                          fontSize: '13px',
                                          color: '#475569',
                                          cursor: 'pointer',
                                          borderBottom: '1px solid #f1f5f9'
                                        }}
                                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
                                        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                      >
                                         Ver motivo incobrable
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMenuAccionesAbierto(null);
                                        abrirModalEditarAcuerdo(item);
                                      }}
                                      style={{
                                        padding: '10px 14px',
                                        textAlign: 'left',
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '13px',
                                        color: '#0f172a',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #f1f5f9'
                                      }}
                                      onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
                                      onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                    >
                                       Modificar Acuerdo
                                    </button>

                                    {esVencido && (
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
                                          cursor: 'pointer',
                                          borderBottom: '1px solid #f1f5f9'
                                        }}
                                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#fef2f2')}
                                        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                      >
                                         Declarar Incobrable
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMenuAccionesAbierto(null);
                                        manejarEliminarAcuerdo(id);
                                      }}
                                      style={{
                                        padding: '10px 14px',
                                        textAlign: 'left',
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '13px',
                                        color: '#ef4444',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                      }}
                                      onMouseEnter={(e) => (e.target.style.backgroundColor = '#fef2f2')}
                                      onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                    >
                                       Eliminar Acuerdo
                                    </button>
                                  </div>
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
          ) : (
            /* ======================================================== */
            /* PESTAÑA 2: REPORTE DE AUSPICIADORES (RF-P4-08)           */
            /* ======================================================== */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>
                    Reporte Consolidado de Aportes
                  </h2>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                    Resumen mensual de aportes comprometidos, cumplidos, vencidos e incobrables por auspiciador (Solo lectura)
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '3px', fontWeight: '600' }}>
                      Mes:
                    </label>
                    <select
                      value={filtroMes}
                      onChange={(e) => setFiltroMes(e.target.value)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        backgroundColor: '#ffffff',
                        fontWeight: '500'
                      }}
                    >
                      <option value="TODOS">Todos los meses</option>
                      <option value="1">Enero</option>
                      <option value="2">Febrero</option>
                      <option value="3">Marzo</option>
                      <option value="4">Abril</option>
                      <option value="5">Mayo</option>
                      <option value="6">Junio</option>
                      <option value="7">Julio</option>
                      <option value="8">Agosto</option>
                      <option value="9">Septiembre</option>
                      <option value="10">Octubre</option>
                      <option value="11">Noviembre</option>
                      <option value="12">Diciembre</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '3px', fontWeight: '600' }}>
                      Año:
                    </label>
                    <select
                      value={filtroAnio}
                      onChange={(e) => setFiltroAnio(e.target.value)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        backgroundColor: '#ffffff',
                        fontWeight: '500'
                      }}
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="TODOS">Todos</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* TARJETAS RESUMEN DE TOTALES */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Comprometido Total</span>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginTop: '4px' }}>
                    ${reporteConsolidado.totales.totalComprometido.toLocaleString('es-CL')}
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{reporteConsolidado.totales.cantidadAcuerdos} acuerdos en el periodo</span>
                </div>

                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: '12px', color: '#166534', fontWeight: '600', textTransform: 'uppercase' }}>Recaudado / Cumplido</span>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#15803d', marginTop: '4px' }}>
                    ${reporteConsolidado.totales.totalCumplido.toLocaleString('es-CL')}
                  </div>
                  <span style={{ fontSize: '11px', color: '#166534' }}>Ingresos efectivos</span>
                </div>

                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                  <span style={{ fontSize: '12px', color: '#991b1b', fontWeight: '600', textTransform: 'uppercase' }}>Total Vencido</span>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#b91c1c', marginTop: '4px' }}>
                    ${reporteConsolidado.totales.totalVencido.toLocaleString('es-CL')}
                  </div>
                  <span style={{ fontSize: '11px', color: '#991b1b' }}>Pendiente fuera de plazo</span>
                </div>

                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                  <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600', textTransform: 'uppercase' }}>Total Incobrable</span>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#334155', marginTop: '4px' }}>
                    ${reporteConsolidado.totales.totalIncobrable.toLocaleString('es-CL')}
                  </div>
                  <span style={{ fontSize: '11px', color: '#475569' }}>Deducción por pérdida</span>
                </div>
              </div>

              {/* TABLA CONSOLIDADA POR AUSPICIADOR */}
              {reporteConsolidado.filas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 15px', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    No se encontraron acuerdos registrados para el periodo seleccionado.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '12px 14px' }}>Auspiciador</th>
                        <th style={{ padding: '12px 14px' }}>Clasificación</th>
                        <th style={{ padding: '12px 14px', textAlign: 'right' }}>Comprometido</th>
                        <th style={{ padding: '12px 14px', textAlign: 'right' }}>Cumplido / Pagado</th>
                        <th style={{ padding: '12px 14px', textAlign: 'right' }}>Vencido</th>
                        <th style={{ padding: '12px 14px', textAlign: 'right' }}>Incobrable</th>
                        <th style={{ padding: '12px 14px', textAlign: 'center' }}>N° Acuerdos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporteConsolidado.filas.map((fila) => {
                        const esNoConfiable = fila.clasificacion === 'NO_CONFIABLE';
                        return (
                          <tr key={fila.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '14px', fontWeight: '600', color: '#1e293b' }}>
                              {fila.nombre}
                            </td>
                            <td style={{ padding: '14px' }}>
                              <span style={{
                                backgroundColor: esNoConfiable ? '#fee2e2' : '#dcfce7',
                                color: esNoConfiable ? '#991b1b' : '#166534',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}>
                                {esNoConfiable ? 'No Confiable' : 'Confiable'}
                              </span>
                            </td>
                            <td style={{ padding: '14px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                              ${fila.comprometido.toLocaleString('es-CL')}
                            </td>
                            <td style={{ padding: '14px', textAlign: 'right', color: '#15803d', fontWeight: '600' }}>
                              ${fila.cumplido.toLocaleString('es-CL')}
                            </td>
                            <td style={{ padding: '14px', textAlign: 'right', color: fila.vencido > 0 ? '#b91c1c' : '#64748b', fontWeight: fila.vencido > 0 ? '600' : 'normal' }}>
                              ${fila.vencido.toLocaleString('es-CL')}
                            </td>
                            <td style={{ padding: '14px', textAlign: 'right', color: fila.incobrable > 0 ? '#475569' : '#94a3b8', fontWeight: fila.incobrable > 0 ? '600' : 'normal' }}>
                              ${fila.incobrable.toLocaleString('es-CL')}
                            </td>
                            <td style={{ padding: '14px', textAlign: 'center', color: '#64748b' }}>
                              {fila.totalAcuerdos}
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

      {/* MODAL 5: MODIFICAR ACUERDO */}
      {modalEditarAcuerdo.abierto && (
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
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', color: '#0f172a' }}>
              Modificar Acuerdo de Auspicio
            </h3>

            <form onSubmit={confirmarEdicionAcuerdo}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px', color: '#334155' }}>
                    Glosa / Compromiso:
                  </label>
                  <textarea
                    value={modalEditarAcuerdo.glosa}
                    onChange={(e) => setModalEditarAcuerdo({ ...modalEditarAcuerdo, glosa: e.target.value })}
                    required
                    rows={2}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px', color: '#334155' }}>
                      Tipo de Aporte:
                    </label>
                    <select
                      value={modalEditarAcuerdo.tipo_aporte}
                      onChange={(e) => setModalEditarAcuerdo({ ...modalEditarAcuerdo, tipo_aporte: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <option value="DINERO">DINERO</option>
                      <option value="CANJE">CANJE</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px', color: '#334155' }}>
                      Monto Comprometido ($):
                    </label>
                    <input
                      type="number"
                      value={modalEditarAcuerdo.monto_comprometido}
                      onChange={(e) => setModalEditarAcuerdo({ ...modalEditarAcuerdo, monto_comprometido: e.target.value })}
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
                </div>

                {modalEditarAcuerdo.tipo_aporte === 'CANJE' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px', color: '#334155' }}>
                      Descripción del Canje:
                    </label>
                    <input
                      type="text"
                      value={modalEditarAcuerdo.descripcion_canje}
                      onChange={(e) => setModalEditarAcuerdo({ ...modalEditarAcuerdo, descripcion_canje: e.target.value })}
                      placeholder="Ej: 50 poleras, bebidas energéticas..."
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
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px', color: '#334155' }}>
                      Cant. Menciones:
                    </label>
                    <input
                      type="number"
                      value={modalEditarAcuerdo.cant_menciones}
                      onChange={(e) => setModalEditarAcuerdo({ ...modalEditarAcuerdo, cant_menciones: e.target.value })}
                      placeholder="Opcional"
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

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px', color: '#334155' }}>
                      Fecha Comprometida:
                    </label>
                    <input
                      type="date"
                      value={modalEditarAcuerdo.fecha_comprometida}
                      onChange={(e) => setModalEditarAcuerdo({ ...modalEditarAcuerdo, fecha_comprometida: e.target.value })}
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
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setModalEditarAcuerdo({
                      abierto: false,
                      id_acuerdo: null,
                      glosa: '',
                      tipo_aporte: 'DINERO',
                      monto_comprometido: '',
                      descripcion_canje: '',
                      cant_menciones: '',
                      fecha_comprometida: ''
                    })}
                    style={{
                      backgroundColor: '#e2e8f0',
                      color: '#334155',
                      border: 'none',
                      padding: '8px 16px',
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
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}