import { useState, useEffect, useMemo } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { AlertTriangle, ChevronDown, Plus, X } from 'lucide-react';
import {
  registrarAuspiciador,
  obtenerAuspiciadores,
  modificarAuspiciador,
  eliminarAuspiciador
} from '../services/auspiciadorService';
import {
  obtenerAcuerdos,
  registrarAcuerdo,
  registrarCumplimiento,
  declararIncobrable,
  modificarAcuerdo,
  eliminarAcuerdo
} from '../services/acuerdoService';
import { listarEventos } from '../services/evento.service.js';
import '../styles/Auspiciadores.css';

export default function Auspiciadores() {
  const [formData, setFormData] = useState({
    nombre: '',
    rubro: '',
    contacto: '',
    telefono: '',
    id_dueno: 1
  });

  const [idEditando, setIdEditando] = useState(null);
  const [mensajeExitoModal, setMensajeExitoModal] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Modal para Registrar Acuerdo (mismo estilo que Registrar Auspiciador)
  const [mostrarModalAcuerdo, setMostrarModalAcuerdo] = useState(false);
  const [formAcuerdo, setFormAcuerdo] = useState({
    id_auspiciador: '',
    id_evento: '',
    tipo_aporte: 'DINERO',
    monto_comprometido: '',
    descripcion_canje: '',
    cant_menciones: '',
    fecha_comprometida: '',
    glosa: ''
  });

  // Pestaña activa: 'acuerdos', 'reporte' o 'auspiciadores'
  const [pestanaActiva, setPestanaActiva] = useState('acuerdos');

  // Filtros de mes y año para el reporte
  const fechaActual = new Date();
  const [filtroMes, setFiltroMes] = useState(String(fechaActual.getMonth() + 1));
  const [filtroAnio, setFiltroAnio] = useState(String(fechaActual.getFullYear()));

  const [listaAcuerdos, setListaAcuerdos] = useState([]);
  const [cargandoAcuerdos, setCargandoAcuerdos] = useState(true);
  const [listaAuspiciadores, setListaAuspiciadores] = useState([]);
  const [listaEventos, setListaEventos] = useState([]);

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

  const [modalIncobrable, setModalIncobrable] = useState({
    abierto: false,
    acuerdo: null,
    motivo: ''
  });

  const [modalVerMotivo, setModalVerMotivo] = useState({
    abierto: false,
    auspiciador: '',
    motivo: ''
  });

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

  const mostrarExitoTemporal = (mensaje) => {
    setMensajeExitoModal(mensaje);
    setTimeout(() => {
      setMensajeExitoModal('');
    }, 1300);
  };

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

  const cargarEventos = async () => {
    try {
      const data = await listarEventos();
      setListaEventos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Aviso al cargar eventos:', error.message);
      setListaEventos([]);
    }
  };

  useEffect(() => {
    cargarAcuerdos();
    cargarAuspiciadores();
    cargarEventos();
  }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const manejarCambioNuevoAcuerdo = (e) => {
    const { name, value } = e.target;
    setFormAcuerdo({ ...formAcuerdo, [name]: value });
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
    setMostrarFormulario(false);
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();

    try {
      if (idEditando) {
        await modificarAuspiciador(idEditando, formData);
      } else {
        await registrarAuspiciador(formData);
        mostrarExitoTemporal('Auspiciador registrado con éxito en el sistema');
      }

      setMostrarFormulario(false);
      cancelarEdicion();
      cargarAuspiciadores();
    } catch (error) {
      console.error(error);
      const msgEspecifico =
        error?.errores?.[0]?.msg ||
        error?.response?.data?.errores?.[0]?.msg ||
        error?.message ||
        'Hubo un error al guardar.';
      alert(msgEspecifico);
    }
  };

  const abrirModalNuevoAcuerdo = () => {
    setFormAcuerdo({
      id_auspiciador: '',
      id_evento: '',
      tipo_aporte: 'DINERO',
      monto_comprometido: '',
      descripcion_canje: '',
      cant_menciones: '',
      fecha_comprometida: '',
      glosa: ''
    });
    setMostrarModalAcuerdo(true);
  };

  const cancelarNuevoAcuerdo = () => {
    setMostrarModalAcuerdo(false);
  };

  const manejarEnvioNuevoAcuerdo = async (e) => {
    e.preventDefault();

    try {
      await registrarAcuerdo({
        id_auspiciador: Number(formAcuerdo.id_auspiciador),
        id_evento: Number(formAcuerdo.id_evento),
        tipo_aporte: formAcuerdo.tipo_aporte,
        monto_comprometido: Number(formAcuerdo.monto_comprometido),
        descripcion_canje:
          formAcuerdo.tipo_aporte === 'CANJE' ? formAcuerdo.descripcion_canje : null,
        cant_menciones: formAcuerdo.cant_menciones
          ? Number(formAcuerdo.cant_menciones)
          : null,
        fecha_comprometida: formAcuerdo.fecha_comprometida,
        glosa: formAcuerdo.glosa
      });

      setMostrarModalAcuerdo(false);
      cargarAcuerdos();
      mostrarExitoTemporal('Acuerdo registrado con éxito en el sistema');
    } catch (error) {
      console.error(error);
      const msgEspecifico =
        error?.errores?.[0]?.msg ||
        error?.response?.data?.errores?.[0]?.msg ||
        error?.message ||
        'Hubo un error al registrar el acuerdo.';
      alert(msgEspecifico);
    }
  };

  const manejarEliminar = async (id) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este auspiciador?');
    if (!confirmar) return;

    try {
      await eliminarAuspiciador(id);
      cargarAuspiciadores();
    } catch (error) {
      console.error(error);
      alert(error.message || 'No se puede eliminar el auspiciador.');
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
      await modificarAuspiciador(id, {
        ...auspiciador,
        clasificacion: nuevoEstado,
        motivo_clasificacion: motivo
      });

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
    const teniaPagosPrevios = (acuerdo?.cumplimientos || []).length > 0;

    try {
      await registrarCumplimiento(id, {
        monto_recibido: Number(monto_recibido),
        fecha_recibida
      });

      setModalCumplimiento({ abierto: false, acuerdo: null, monto_recibido: '', fecha_recibida: '' });
      cargarAcuerdos();

      if (!teniaPagosPrevios && Number(monto_recibido) > 0) {
        mostrarExitoTemporal('Cumplimiento de aporte registrado con éxito');
      }
    } catch (error) {
      alert('Error al registrar cumplimiento: ' + error.message);
    }
  };

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
        cant_menciones: modalEditarAcuerdo.cant_menciones
          ? Number(modalEditarAcuerdo.cant_menciones)
          : null,
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
    const confirmar = window.confirm(
      '¿Estás seguro de que deseas eliminar este acuerdo? Se borrarán también los registros de pago asociados.'
    );
    if (!confirmar) return;

    try {
      await eliminarAcuerdo(idAcuerdo);
      cargarAcuerdos();
    } catch (error) {
      alert('Error al eliminar acuerdo: ' + error.message);
    }
  };

  const renderBadgeAcuerdo = (estado = 'PENDIENTE') => {
    let claseVariante = 'ausp-badge-pendiente';
    if (estado === 'CUMPLIDO') claseVariante = 'ausp-badge-cumplido';
    else if (estado === 'PARCIAL') claseVariante = 'ausp-badge-parcial';
    else if (estado === 'VENCIDO') claseVariante = 'ausp-badge-vencido';
    else if (estado === 'INCOBRABLE') claseVariante = 'ausp-badge-incobrable';

    return <span className={`ausp-badge ${claseVariante}`}>{estado}</span>;
  };

  const obtenerClaseBotonGestionar = (esCumplido, esIncobrable) => {
    if (esCumplido) return 'ausp-btn-gestionar ausp-btn-gestionar-cumplido';
    if (esIncobrable) return 'ausp-btn-gestionar ausp-btn-gestionar-incobrable';
    return 'ausp-btn-gestionar ausp-btn-gestionar-activo';
  };

  const acuerdosVencidos = listaAcuerdos.filter((a) => a.estado === 'VENCIDO');

  const reporteConsolidado = useMemo(() => {
    const acuerdosFiltrados = listaAcuerdos.filter((acuerdo) => {
      const fecha = acuerdo.fecha_comprometida ? new Date(acuerdo.fecha_comprometida) : null;
      if (!fecha) return false;

      const coincideAnio = filtroAnio === 'TODOS' || fecha.getFullYear() === Number(filtroAnio);
      const coincideMes = filtroMes === 'TODOS' || fecha.getMonth() + 1 === Number(filtroMes);

      return coincideAnio && coincideMes;
    });

    let totalComprometido = 0;
    let totalCumplido = 0;
    let totalVencido = 0;
    let totalIncobrable = 0;

    const mapaAuspiciadores = {};

    acuerdosFiltrados.forEach((acuerdo) => {
      const idAusp =
        acuerdo.id_auspiciador ||
        (acuerdo.auspiciador ? acuerdo.auspiciador.id_auspiciador : 'sin_id');
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
          totalAcuerdos: 0
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
        cantidadAcuerdos: acuerdosFiltrados.length
      },
      filas: Object.values(mapaAuspiciadores)
    };
  }, [listaAcuerdos, filtroMes, filtroAnio]);

  return (
    <div className="ausp-pagina">
      {/* TÍTULO PRINCIPAL */}
      <div className="ausp-encabezado">
        <h1>Auspiciadores</h1>
        <p>Gestión de auspiciadores, eventos, acuerdos de auspicio y control de aportes</p>
      </div>

      {/* CONTENEDOR GENERAL */}
      <div className="ausp-panel">
        {/* PESTAÑAS */}
        <div className="ausp-tabs-bar">
          <div className="ausp-tabs-grupo">
            <button
              type="button"
              onClick={() => setPestanaActiva('acuerdos')}
              className={`ausp-tab ${pestanaActiva === 'acuerdos' ? 'activa' : ''}`}
            >
              Acuerdos de Auspicio
            </button>

            <button
              type="button"
              onClick={() => setPestanaActiva('reporte')}
              className={`ausp-tab ${pestanaActiva === 'reporte' ? 'activa' : ''}`}
            >
              Reporte Mensual de Aportes
            </button>

            <button
              type="button"
              onClick={() => setPestanaActiva('auspiciadores')}
              className={`ausp-tab ${pestanaActiva === 'auspiciadores' ? 'activa' : ''}`}
            >
              Auspiciadores
            </button>
          </div>
        </div>

        {/* BANNER DE ALERTA DE ACUERDOS VENCIDOS */}
        {pestanaActiva === 'acuerdos' && acuerdosVencidos.length > 0 && (
          <div className="ausp-alerta-vencidos">
            <AlertTriangle size={18} className="ausp-alerta-icono" />
            <div>
              <h4 className="ausp-alerta-titulo">
                Alerta: Tienes {acuerdosVencidos.length}{' '}
                {acuerdosVencidos.length === 1 ? 'acuerdo vencido' : 'acuerdos vencidos'}
              </h4>
              <p className="ausp-alerta-texto">
                Se ha superado la fecha comprometida sin registrar el pago completo del aporte.
              </p>
            </div>
          </div>
        )}

        {/* CONTENIDO SEGÚN PESTAÑA ACTIVA */}
        <div>
          {pestanaActiva === 'acuerdos' && (
            <div>
              <div className="ausp-seccion-cab">
                <div>
                  <h2 className="ausp-seccion-titulo">Acuerdos de Auspicio</h2>
                  <p className="ausp-seccion-sub">
                    Acuerdos por evento, glosa, cumplimiento de aporte y acciones
                  </p>
                </div>

                <button
                  type="button"
                  onClick={abrirModalNuevoAcuerdo}
                  className="ausp-btn-nuevo"
                >
                  <Plus size={18} />
                  <span>Registrar acuerdo</span>
                </button>
              </div>

              {cargandoAcuerdos ? (
                <p className="ausp-cargando">Cargando acuerdos...</p>
              ) : listaAcuerdos.length === 0 ? (
                <div className="ausp-vacio">
                  <p>No hay acuerdos registrados todavía.</p>
                </div>
              ) : (
                <div className="ausp-tabla-scroll">
                  <table className="ausp-tabla">
                    <thead>
                      <tr>
                        <th>Auspiciador</th>
                        <th>Evento</th>
                        <th>Tipo de Pago</th>
                        <th>Glosa</th>
                        <th>Plazo</th>
                        <th>Estado</th>
                        <th className="ausp-th-centro">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listaAcuerdos.map((item) => {
                        const id = item.id_acuerdo || item.id;
                        const nombreAuspiciador =
                          item.auspiciador?.nombre || `Auspiciador #${item.id_auspiciador || '-'}`;
                        const nombreEvento =
                          item.evento?.tipo ||
                          item.evento?.nombre ||
                          `Evento #${item.id_evento || '-'}`;
                        const tipoPago = item.tipo_aporte || item.tipo_pago || 'Aporte';
                        const detalleMonto =
                          item.monto_comprometido || item.monto
                            ? ` — $${Number(item.monto_comprometido || item.monto).toLocaleString('es-CL')}`
                            : '';
                        const fechaPlazo =
                          item.fecha_comprometida || item.fecha_limite
                            ? new Date(
                                item.fecha_comprometida || item.fecha_limite
                              ).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
                            : '--';

                        const totalPagado = (item.cumplimientos || []).reduce(
                          (acc, c) => acc + Number(c.monto_recibido || 0),
                          0
                        );

                        const estado = item.estado || 'PENDIENTE';
                        const esCumplido = estado === 'CUMPLIDO';
                        const esVencido = estado === 'VENCIDO';
                        const esIncobrable = estado === 'INCOBRABLE';

                        return (
                          <tr
                            key={id}
                            className={`ausp-tr ${esVencido ? 'ausp-tr-vencido' : ''}`}
                          >
                            <td className="ausp-td-nombre">{nombreAuspiciador}</td>
                            <td className="ausp-td-texto">{nombreEvento}</td>
                            <td className="ausp-td-texto">
                              {tipoPago}
                              {detalleMonto}
                              {totalPagado > 0 && (
                                <div className="ausp-td-recibido">
                                  Recibido: ${totalPagado.toLocaleString('es-CL')}
                                </div>
                              )}
                            </td>
                            <td className="ausp-td-glosa">{item.glosa || 'Sin glosa'}</td>
                            <td
                              className={
                                esVencido ? 'ausp-td-plazo-vencido' : 'ausp-td-plazo'
                              }
                            >
                              {fechaPlazo}
                            </td>
                            <td>{renderBadgeAcuerdo(estado)}</td>
                            <td className="ausp-td-acciones">
                              <div className="ausp-menu-wrap">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMenuAccionesAbierto(menuAccionesAbierto === id ? null : id)
                                  }
                                  className={obtenerClaseBotonGestionar(esCumplido, esIncobrable)}
                                >
                                  <span>Gestionar</span>
                                  <ChevronDown size={14} />
                                </button>

                                {menuAccionesAbierto === id && (
                                  <div className="ausp-menu-dropdown">
                                    {!esIncobrable && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMenuAccionesAbierto(null);
                                          abrirModalCumplimiento(item);
                                        }}
                                        className="ausp-menu-item"
                                      >
                                        {esCumplido
                                          ? 'Ver / Modificar Pago'
                                          : 'Registrar Pago / Entrega'}
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
                                            motivo:
                                              item.motivo_incobrable || 'Sin motivo especificado.'
                                          });
                                        }}
                                        className="ausp-menu-item ausp-menu-item-suave"
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
                                      className="ausp-menu-item"
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
                                        className="ausp-menu-item ausp-menu-item-peligro"
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
                                      className="ausp-menu-item ausp-menu-item-eliminar"
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
          )}

          {pestanaActiva === 'reporte' && (
            <div>
              <div className="ausp-seccion-cab-reporte">
                <div>
                  <h2 className="ausp-seccion-titulo">Reporte Consolidado de Aportes</h2>
                  <p className="ausp-seccion-sub">
                    Resumen mensual de aportes comprometidos, cumplidos, vencidos e incobrables por
                    auspiciador (Solo lectura)
                  </p>
                </div>

                <div className="ausp-filtros-reporte">
                  <div>
                    <label className="ausp-filtro-label">Mes:</label>
                    <select
                      value={filtroMes}
                      onChange={(e) => setFiltroMes(e.target.value)}
                      className="ausp-filtro-select"
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
                    <label className="ausp-filtro-label">Año:</label>
                    <select
                      value={filtroAnio}
                      onChange={(e) => setFiltroAnio(e.target.value)}
                      className="ausp-filtro-select"
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="TODOS">Todos</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* TARJETAS RESUMEN DE TOTALES */}
              <div className="ausp-kpis-grid">
                <div className="ausp-kpi-card">
                  <span className="ausp-kpi-label">Comprometido Total</span>
                  <div className="ausp-kpi-valor">
                    ${reporteConsolidado.totales.totalComprometido.toLocaleString('es-CL')}
                  </div>
                  <span className="ausp-kpi-sub">
                    {reporteConsolidado.totales.cantidadAcuerdos} acuerdos en el periodo
                  </span>
                </div>

                <div className="ausp-kpi-card ausp-kpi-verde">
                  <span className="ausp-kpi-label">Recaudado / Cumplido</span>
                  <div className="ausp-kpi-valor">
                    ${reporteConsolidado.totales.totalCumplido.toLocaleString('es-CL')}
                  </div>
                  <span className="ausp-kpi-sub">Ingresos efectivos</span>
                </div>

                <div className="ausp-kpi-card ausp-kpi-rojo">
                  <span className="ausp-kpi-label">Total Vencido</span>
                  <div className="ausp-kpi-valor">
                    ${reporteConsolidado.totales.totalVencido.toLocaleString('es-CL')}
                  </div>
                  <span className="ausp-kpi-sub">Pendiente fuera de plazo</span>
                </div>

                <div className="ausp-kpi-card ausp-kpi-gris">
                  <span className="ausp-kpi-label">Total Incobrable</span>
                  <div className="ausp-kpi-valor">
                    ${reporteConsolidado.totales.totalIncobrable.toLocaleString('es-CL')}
                  </div>
                  <span className="ausp-kpi-sub">Deducción por pérdida</span>
                </div>
              </div>

              {/* TABLA CONSOLIDADA POR AUSPICIADOR */}
              {reporteConsolidado.filas.length === 0 ? (
                <div className="ausp-vacio-caja">
                  <p>No se encontraron acuerdos registrados para el periodo seleccionado.</p>
                </div>
              ) : (
                <div className="ausp-tabla-scroll">
                  <table className="ausp-tabla">
                    <thead>
                      <tr>
                        <th>Auspiciador</th>
                        <th>Clasificación</th>
                        <th className="ausp-th-der">Comprometido</th>
                        <th className="ausp-th-der">Cumplido / Pagado</th>
                        <th className="ausp-th-der">Vencido</th>
                        <th className="ausp-th-der">Incobrable</th>
                        <th className="ausp-th-centro">N° Acuerdos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporteConsolidado.filas.map((fila) => {
                        const esNoConfiable = fila.clasificacion === 'NO_CONFIABLE';
                        return (
                          <tr key={fila.id} className="ausp-tr">
                            <td className="ausp-td-nombre">{fila.nombre}</td>
                            <td>
                              <span
                                className={`ausp-badge-conf ${
                                  esNoConfiable ? 'ausp-badge-conf-no' : 'ausp-badge-conf-si'
                                }`}
                              >
                                {esNoConfiable ? 'No Confiable' : 'Confiable'}
                              </span>
                            </td>
                            <td className="ausp-td-monto-bold">
                              ${fila.comprometido.toLocaleString('es-CL')}
                            </td>
                            <td className="ausp-td-monto-verde">
                              ${fila.cumplido.toLocaleString('es-CL')}
                            </td>
                            <td
                              className={
                                fila.vencido > 0 ? 'ausp-td-monto-rojo' : 'ausp-td-monto-gris'
                              }
                            >
                              ${fila.vencido.toLocaleString('es-CL')}
                            </td>
                            <td
                              className={
                                fila.incobrable > 0
                                  ? 'ausp-td-monto-incobrable'
                                  : 'ausp-td-monto-tenue'
                              }
                            >
                              ${fila.incobrable.toLocaleString('es-CL')}
                            </td>
                            <td className="ausp-td-contador">{fila.totalAcuerdos}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {pestanaActiva === 'auspiciadores' && (
            <div>
              <div className="ausp-seccion-cab">
                <div>
                  <h2 className="ausp-seccion-titulo">Auspiciadores Registrados</h2>
                  <p className="ausp-seccion-sub">
                    Listado de auspiciadores, rubro, contacto y estado de confianza
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    cancelarEdicion();
                    setMostrarFormulario(true);
                  }}
                  className="ausp-btn-nuevo"
                >
                  <Plus size={18} />
                  <span>Registrar auspiciador</span>
                </button>
              </div>

              {listaAuspiciadores.length === 0 ? (
                <div className="ausp-vacio-caja">
                  <p>No hay auspiciadores registrados aún.</p>
                </div>
              ) : (
                <div className="ausp-tarjetas-grid">
                  {listaAuspiciadores.map((item) => {
                    const id = item.id_auspiciador || item.id;
                    const esNoConfiable = item.clasificacion === 'NO_CONFIABLE';

                    return (
                      <div key={id} className="ausp-tarjeta">
                        <div className="ausp-tarjeta-cab">
                          <h4 className="ausp-tarjeta-titulo">{item.nombre}</h4>

                          <button
                            type="button"
                            onClick={() => abrirModalCambio(item)}
                            title="Haz clic para cambiar la clasificación"
                            className={`ausp-btn-estado-conf ${
                              esNoConfiable ? 'ausp-btn-no-confiable' : 'ausp-btn-confiable'
                            }`}
                          >
                            {esNoConfiable ? 'No confiable' : 'Confiable'}
                          </button>
                        </div>

                        <p className="ausp-tarjeta-dato">
                          <strong>Rubro:</strong> {item.rubro}
                        </p>
                        <p className="ausp-tarjeta-dato">
                          <strong>Contacto:</strong> {item.contacto}
                        </p>
                        <p className="ausp-tarjeta-dato">
                          <strong>Teléfono:</strong> {item.telefono}
                        </p>

                        {item.motivo_clasificacion && (
                          <p className="ausp-tarjeta-motivo">
                            <strong>Motivo:</strong> {item.motivo_clasificacion}
                          </p>
                        )}

                        <div className="ausp-tarjeta-acciones">
                          <button
                            type="button"
                            onClick={() => iniciarEdicion(item)}
                            className="ausp-btn-modificar-card"
                          >
                            Modificar
                          </button>

                          <button
                            type="button"
                            onClick={() => manejarEliminar(id)}
                            className="ausp-btn-eliminar-card"
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
          )}
        </div>
      </div>

      {/* ================= MODAL DE ÉXITO (SOLO AL AÑADIR) ================= */}
      {mensajeExitoModal && (
        <div className="ausp-modal-fondo">
          <div className="ausp-modal-exito">
            <div className="ausp-modal-exito-contenido">
              <FaCheckCircle className="ausp-icono-exito" />
              <h2 className="ausp-modal-exito-titulo">¡Operación Exitosa!</h2>
              <p className="ausp-modal-exito-texto">{mensajeExitoModal}</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL REGISTRAR / MODIFICAR AUSPICIADOR ================= */}
      {mostrarFormulario && (
        <div className="ausp-modal-fondo">
          <div className="ausp-modal-caja ausp-modal-caja-ancha">
            <h2 className="ausp-modal-titulo">
              {idEditando ? 'Modificar Auspiciador' : 'Registrar Auspiciador'}
            </h2>
            <p className="ausp-modal-sub">
              Ingresa los datos correspondientes para el registro o actualización del auspiciador.
            </p>

            <form onSubmit={manejarEnvio} className="ausp-form">
              <div>
                <label className="ausp-label">Nombre del Auspiciador:</label>
                <input
                  type="text"
                  name="nombre"
                  maxLength={80}
                  value={formData.nombre}
                  onChange={manejarCambio}
                  required
                  placeholder="Ej: Red Bull"
                  className="ausp-input"
                />
              </div>

              <div className="ausp-form-fila">
                <div>
                  <label className="ausp-label">Rubro:</label>
                  <input
                    type="text"
                    name="rubro"
                    maxLength={80}
                    value={formData.rubro}
                    onChange={manejarCambio}
                    required
                    placeholder="Ej: Bebidas energéticas"
                    className="ausp-input"
                  />
                </div>

                <div>
                  <label className="ausp-label">Nombre del Contacto:</label>
                  <input
                    type="text"
                    name="contacto"
                    maxLength={80}
                    value={formData.contacto}
                    onChange={manejarCambio}
                    required
                    placeholder="Ej: Juan Pérez"
                    className="ausp-input"
                  />
                </div>
              </div>

              <div>
                <label className="ausp-label">Teléfono:</label>
                <input
                  type="text"
                  name="telefono"
                  maxLength={16}
                  value={formData.telefono}
                  onChange={manejarCambio}
                  required
                  placeholder="Ej: +56912345678"
                  className="ausp-input"
                />
              </div>

              <div className="ausp-modal-pie-borde">
                <button
                  type="button"
                  onClick={cancelarEdicion}
                  className="ausp-btn-cancelar"
                >
                  Cancelar
                </button>
                <button type="submit" className="ausp-btn-guardar">
                  {idEditando ? 'Guardar Cambios' : 'Guardar Auspiciador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL REGISTRAR ACUERDO DE AUSPICIO ================= */}
      {mostrarModalAcuerdo && (
        <div className="ausp-modal-fondo">
          <div className="ausp-modal-caja ausp-modal-caja-ancha">
            <h2 className="ausp-modal-titulo">Registrar Acuerdo de Auspicio</h2>
            <p className="ausp-modal-sub">
              Establece los compromisos comerciales, aportes y plazos para eventos.
            </p>

            <form onSubmit={manejarEnvioNuevoAcuerdo} className="ausp-form">
              <div className="ausp-form-fila">
                <div>
                  <label className="ausp-label">Auspiciador:</label>
                  <select
                    name="id_auspiciador"
                    value={formAcuerdo.id_auspiciador}
                    onChange={manejarCambioNuevoAcuerdo}
                    required
                    className="ausp-select"
                  >
                    <option value="">-- Selecciona un auspiciador --</option>
                    {listaAuspiciadores.map((ausp) => {
                      const idAusp = ausp.id_auspiciador || ausp.id;
                      return (
                        <option key={idAusp} value={idAusp}>
                          {ausp.nombre}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="ausp-label">Evento / Transmisión:</label>
                  <select
                    name="id_evento"
                    value={formAcuerdo.id_evento}
                    onChange={manejarCambioNuevoAcuerdo}
                    required
                    className="ausp-select"
                  >
                    <option value="">-- Selecciona un evento --</option>
                    {listaEventos.map((ev) => {
                      const idEv = ev.id_evento || ev.id;
                      const fechaEv = ev.fecha
                        ? new Date(ev.fecha).toLocaleDateString('es-CL')
                        : '';
                      return (
                        <option key={idEv} value={idEv}>
                          {ev.tipo || ev.nombre || `Evento #${idEv}`} {fechaEv ? `(${fechaEv})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="ausp-form-fila">
                <div>
                  <label className="ausp-label">Tipo de Aporte:</label>
                  <select
                    name="tipo_aporte"
                    value={formAcuerdo.tipo_aporte}
                    onChange={manejarCambioNuevoAcuerdo}
                    className="ausp-select"
                  >
                    <option value="DINERO">Dinero</option>
                    <option value="CANJE">Canje</option>
                  </select>
                </div>

                <div>
                  <label className="ausp-label">Monto Comprometido ($):</label>
                  <input
                    type="number"
                    name="monto_comprometido"
                    value={formAcuerdo.monto_comprometido}
                    onChange={manejarCambioNuevoAcuerdo}
                    required
                    min="1"
                    placeholder="Ej: 150000"
                    className="ausp-input"
                  />
                </div>
              </div>

              {formAcuerdo.tipo_aporte === 'CANJE' && (
                <div>
                  <label className="ausp-label">Descripción del Canje:</label>
                  <input
                    type="text"
                    name="descripcion_canje"
                    maxLength={120}
                    value={formAcuerdo.descripcion_canje}
                    onChange={manejarCambioNuevoAcuerdo}
                    required
                    placeholder="Ej: 50 bebidas isotónicas..."
                    className="ausp-input"
                  />
                </div>
              )}

              <div className="ausp-form-fila">
                <div>
                  <label className="ausp-label">Cantidad de Menciones:</label>
                  <input
                    type="number"
                    name="cant_menciones"
                    value={formAcuerdo.cant_menciones}
                    onChange={manejarCambioNuevoAcuerdo}
                    min="0"
                    placeholder="Ej: 3"
                    className="ausp-input"
                  />
                </div>

                <div>
                  <label className="ausp-label">Fecha Límite de Pago:</label>
                  <input
                    type="date"
                    name="fecha_comprometida"
                    lang="es-CL"
                    value={formAcuerdo.fecha_comprometida}
                    onChange={manejarCambioNuevoAcuerdo}
                    required
                    className="ausp-input"
                  />
                </div>
              </div>

              <div>
                <label className="ausp-label">Glosa del Acuerdo Verbal:</label>
                <textarea
                  name="glosa"
                  maxLength={255}
                  value={formAcuerdo.glosa}
                  onChange={manejarCambioNuevoAcuerdo}
                  required
                  rows={3}
                  placeholder="Especifica condiciones, logos requeridos o detalles acordados verbalmente..."
                  className="ausp-textarea"
                />
              </div>

              <div className="ausp-modal-pie-borde">
                <button
                  type="button"
                  onClick={cancelarNuevoAcuerdo}
                  className="ausp-btn-cancelar"
                >
                  Cancelar
                </button>
                <button type="submit" className="ausp-btn-guardar">
                  Guardar Acuerdo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: CUMPLIMIENTO ================= */}
      {modalCumplimiento.abierto && (
        <div className="ausp-modal-fondo">
          <div className="ausp-modal-caja">
            <h3 className="ausp-modal-titulo">Registrar Cumplimiento del Aporte</h3>

            <p className="ausp-modal-sub">
              Auspiciador:{' '}
              <strong>{modalCumplimiento.acuerdo?.auspiciador?.nombre || 'Acuerdo'}</strong> <br />
              Monto Comprometido:{' '}
              <strong>
                ${Number(modalCumplimiento.acuerdo?.monto_comprometido || 0).toLocaleString('es-CL')}
              </strong>{' '}
              ({modalCumplimiento.acuerdo?.tipo_aporte})
            </p>

            <form onSubmit={confirmarCumplimiento}>
              <div className="ausp-campo-grupo">
                <label className="ausp-label">
                  {modalCumplimiento.acuerdo?.tipo_aporte === 'DINERO'
                    ? 'Monto Recibido ($):'
                    : 'Valorización del Canje Recibido ($):'}
                </label>
                <input
                  type="number"
                  value={modalCumplimiento.monto_recibido}
                  onChange={(e) =>
                    setModalCumplimiento({ ...modalCumplimiento, monto_recibido: e.target.value })
                  }
                  placeholder="Ej: 100000 (0 para restablecer)"
                  required
                  className="ausp-input"
                />
                <span className="ausp-ayuda-input">
                  Ingresa 0 si deseas anular los registros de pago y restablecer el acuerdo.
                </span>
              </div>

              <div className="ausp-campo-grupo-lg">
                <label className="ausp-label">Fecha de Recepción:</label>
                <input
                  type="date"
                  lang="es-CL"
                  value={modalCumplimiento.fecha_recibida}
                  onChange={(e) =>
                    setModalCumplimiento({ ...modalCumplimiento, fecha_recibida: e.target.value })
                  }
                  required
                  className="ausp-input"
                />
              </div>

              <div className="ausp-modal-pie">
                <button
                  type="button"
                  onClick={() =>
                    setModalCumplimiento({
                      abierto: false,
                      acuerdo: null,
                      monto_recibido: '',
                      fecha_recibida: ''
                    })
                  }
                  className="ausp-btn-cancelar"
                >
                  Cancelar
                </button>
                <button type="submit" className="ausp-btn-guardar">
                  Guardar Cumplimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: CLASIFICACIÓN ================= */}
      {modalClasificacion.abierto && (
        <div className="ausp-modal-fondo">
          <div className="ausp-modal-caja">
            <h3 className="ausp-modal-titulo">
              Cambiar clasificación a:{' '}
              {modalClasificacion.nuevoEstado === 'NO_CONFIABLE' ? 'No Confiable' : 'Confiable'}
            </h3>

            <p className="ausp-modal-sub">
              Auspiciador: <strong>{modalClasificacion.auspiciador?.nombre}</strong>
            </p>

            <form onSubmit={confirmarCambioClasificacion}>
              <div className="ausp-campo-grupo">
                <label className="ausp-label">Motivo del cambio (requerido):</label>
                <textarea
                  value={modalClasificacion.motivo}
                  onChange={(e) =>
                    setModalClasificacion({ ...modalClasificacion, motivo: e.target.value })
                  }
                  placeholder="Ej: Retraso reiterado de pagos o incumplimiento de aportes..."
                  required
                  rows={3}
                  className="ausp-textarea"
                />
              </div>

              <div className="ausp-modal-pie">
                <button
                  type="button"
                  onClick={() =>
                    setModalClasificacion({
                      abierto: false,
                      auspiciador: null,
                      nuevoEstado: '',
                      motivo: ''
                    })
                  }
                  className="ausp-btn-cancelar"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={
                    modalClasificacion.nuevoEstado === 'NO_CONFIABLE'
                      ? 'ausp-btn-guardar-peligro'
                      : 'ausp-btn-guardar-exito'
                  }
                >
                  Guardar Clasificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: DECLARAR INCOBRABLE ================= */}
      {modalIncobrable.abierto && (
        <div className="ausp-modal-fondo">
          <div className="ausp-modal-caja">
            <h3 className="ausp-modal-titulo-rojo">Declarar Aporte Incobrable</h3>

            <p className="ausp-modal-sub">
              Auspiciador:{' '}
              <strong>{modalIncobrable.acuerdo?.auspiciador?.nombre || 'Acuerdo'}</strong> <br />
              Monto Comprometido no recuperado:{' '}
              <strong>
                ${Number(modalIncobrable.acuerdo?.monto_comprometido || 0).toLocaleString('es-CL')}
              </strong>
            </p>

            <form onSubmit={confirmarIncobrable}>
              <div className="ausp-campo-grupo">
                <label className="ausp-label">
                  Motivo por el cual se da por perdido el cobro (requerido):
                </label>
                <textarea
                  value={modalIncobrable.motivo}
                  onChange={(e) =>
                    setModalIncobrable({ ...modalIncobrable, motivo: e.target.value })
                  }
                  placeholder="Ej: Auspiciador no contesta correos ni llamadas..."
                  required
                  rows={3}
                  className="ausp-textarea"
                />
              </div>

              <div className="ausp-modal-pie">
                <button
                  type="button"
                  onClick={() =>
                    setModalIncobrable({ abierto: false, acuerdo: null, motivo: '' })
                  }
                  className="ausp-btn-cancelar"
                >
                  Cancelar
                </button>
                <button type="submit" className="ausp-btn-guardar-peligro">
                  Confirmar Incobrable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: VER MOTIVO DE INCOBRABLE ================= */}
      {modalVerMotivo.abierto && (
        <div
          className="ausp-modal-fondo"
          onClick={() => setModalVerMotivo({ abierto: false, auspiciador: '', motivo: '' })}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="ausp-modal-caja ausp-modal-caja-chica"
          >
            <div className="ausp-modal-cab-cerrar">
              <h3 className="ausp-modal-titulo">Motivo de Incobrable</h3>
              <button
                type="button"
                onClick={() =>
                  setModalVerMotivo({ abierto: false, auspiciador: '', motivo: '' })
                }
                className="ausp-btn-x"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <p className="ausp-modal-sub">
              Auspiciador: <strong>{modalVerMotivo.auspiciador}</strong>
            </p>

            <div className="ausp-cita-motivo">&ldquo;{modalVerMotivo.motivo}&rdquo;</div>

            <div className="ausp-modal-pie">
              <button
                type="button"
                onClick={() =>
                  setModalVerMotivo({ abierto: false, auspiciador: '', motivo: '' })
                }
                className="ausp-btn-guardar"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: MODIFICAR ACUERDO ================= */}
      {modalEditarAcuerdo.abierto && (
        <div className="ausp-modal-fondo">
          <div className="ausp-modal-caja ausp-modal-caja-media">
            <h3 className="ausp-modal-titulo-espacio">Modificar Acuerdo de Auspicio</h3>

            <form onSubmit={confirmarEdicionAcuerdo} className="ausp-form">
              <div>
                <label className="ausp-label">Glosa / Compromiso:</label>
                <textarea
                  value={modalEditarAcuerdo.glosa}
                  onChange={(e) =>
                    setModalEditarAcuerdo({ ...modalEditarAcuerdo, glosa: e.target.value })
                  }
                  required
                  rows={2}
                  className="ausp-textarea"
                />
              </div>

              <div className="ausp-form-fila">
                <div>
                  <label className="ausp-label">Tipo de Aporte:</label>
                  <select
                    value={modalEditarAcuerdo.tipo_aporte}
                    onChange={(e) =>
                      setModalEditarAcuerdo({
                        ...modalEditarAcuerdo,
                        tipo_aporte: e.target.value
                      })
                    }
                    className="ausp-select"
                  >
                    <option value="DINERO">DINERO</option>
                    <option value="CANJE">CANJE</option>
                  </select>
                </div>

                <div>
                  <label className="ausp-label">Monto Comprometido ($):</label>
                  <input
                    type="number"
                    value={modalEditarAcuerdo.monto_comprometido}
                    onChange={(e) =>
                      setModalEditarAcuerdo({
                        ...modalEditarAcuerdo,
                        monto_comprometido: e.target.value
                      })
                    }
                    required
                    className="ausp-input"
                  />
                </div>
              </div>

              {modalEditarAcuerdo.tipo_aporte === 'CANJE' && (
                <div>
                  <label className="ausp-label">Descripción del Canje:</label>
                  <input
                    type="text"
                    value={modalEditarAcuerdo.descripcion_canje}
                    onChange={(e) =>
                      setModalEditarAcuerdo({
                        ...modalEditarAcuerdo,
                        descripcion_canje: e.target.value
                      })
                    }
                    placeholder="Ej: 50 poleras..."
                    className="ausp-input"
                  />
                </div>
              )}

              <div className="ausp-form-fila">
                <div>
                  <label className="ausp-label">Cant. Menciones:</label>
                  <input
                    type="number"
                    value={modalEditarAcuerdo.cant_menciones}
                    onChange={(e) =>
                      setModalEditarAcuerdo({
                        ...modalEditarAcuerdo,
                        cant_menciones: e.target.value
                      })
                    }
                    placeholder="Opcional"
                    className="ausp-input"
                  />
                </div>

                <div>
                  <label className="ausp-label">Fecha Comprometida:</label>
                  <input
                    type="date"
                    lang="es-CL"
                    value={modalEditarAcuerdo.fecha_comprometida}
                    onChange={(e) =>
                      setModalEditarAcuerdo({
                        ...modalEditarAcuerdo,
                        fecha_comprometida: e.target.value
                      })
                    }
                    required
                    className="ausp-input"
                  />
                </div>
              </div>

              <div className="ausp-modal-pie">
                <button
                  type="button"
                  onClick={() =>
                    setModalEditarAcuerdo({
                      abierto: false,
                      id_acuerdo: null,
                      glosa: '',
                      tipo_aporte: 'DINERO',
                      monto_comprometido: '',
                      descripcion_canje: '',
                      cant_menciones: '',
                      fecha_comprometida: ''
                    })
                  }
                  className="ausp-btn-cancelar"
                >
                  Cancelar
                </button>
                <button type="submit" className="ausp-btn-guardar">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}