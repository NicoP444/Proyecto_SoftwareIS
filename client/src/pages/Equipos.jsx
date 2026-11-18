import { useState, useEffect } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import {
  AlertTriangle,
  Box,
  Mic,
  Monitor,
  Plus,
  Sliders,
  Trash2,
  Video
} from 'lucide-react';
import {
  obtenerEquipos,
  registrarEquipo,
  actualizarEquipo,
  darDeBajaEquipo,
  eliminarEquipo
} from '../services/equipoService';
import { kitClientService } from '../services/kit.service';
import '../styles/Equipos.css';

// Obtiene la fecha de hoy en formato local YYYY-MM-DD (evita que pase a mañana por UTC)
const obtenerFechaHoyLocal = () => {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

// Formatea fecha ISO ("2026-11-15T...") a "DD-MM-YYYY" sin desfase de zona horaria
const formatearFechaTabla = (valorFecha) => {
  if (!valorFecha) return '--';
  const iso = String(valorFecha).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '--';
  const [a, m, d] = iso.split('-');
  return `${d}-${m}-${a}`;
};

// Impide escribir signos negativos, decimales o notación científica en montos enteros
const bloquearNegativosEnteros = (e) => {
  if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
    e.preventDefault();
  }
};

// Impide escribir signos negativos en porcentajes decimales
const bloquearNegativosDecimal = (e) => {
  if (['-', '+', 'e', 'E'].includes(e.key)) {
    e.preventDefault();
  }
};

// Valida que un texto tenga al menos N letras reales (bloquea "222", "2222", etc.)
const tieneMinimoLetras = (texto, minLetras = 2) => {
  const limpio = String(texto || '').trim();
  const coincidencias = limpio.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g) || [];
  return coincidencias.length >= minLetras;
};

export default function Equipos() {
  const fechaHoyLocal = obtenerFechaHoyLocal();
  const [activeTab, setActiveTab] = useState('KITS');

  // --- ESTADOS DE EQUIPOS / INVENTARIO ---
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'CAMARA',
    marca: '',
    modelo: '',
    fecha_compra: fechaHoyLocal,
    valor_compra: '',
    id_jefe: 1
  });

  const [listaEquipos, setListaEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoEquipo, setGuardandoEquipo] = useState(false);

  const [errorEquipo, setErrorEquipo] = useState('');
  const [errorEditarEquipo, setErrorEditarEquipo] = useState('');
  const [errorBajaEquipo, setErrorBajaEquipo] = useState('');
  const [mensajeExitoModal, setMensajeExitoModal] = useState('');

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [equipoEditando, setEquipoEditando] = useState(null);
  const [equipoBaja, setEquipoBaja] = useState(null);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');

  // --- ESTADOS DE KITS ---
  const [kits, setKits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombreKit, setNombreKit] = useState('');
  const [nivelKit, setNivelKit] = useState('BASICO');
  const [recargoPct, setRecargoPct] = useState(0);

  // Selección por categoría para CREAR
  const [camaraSeleccionada, setCamaraSeleccionada] = useState('');
  const [tripodeSeleccionado, setTripodeSeleccionado] = useState('');
  const [microfonoSeleccionado, setMicrofonoSeleccionado] = useState('');
  const [switchSeleccionado, setSwitchSeleccionado] = useState('');
  const [equiposAdicionalesCrear, setEquiposAdicionalesCrear] = useState([]);

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
  const [equiposAdicionalesEditar, setEquiposAdicionalesEditar] = useState([]);
  const [errorEditKit, setErrorEditKit] = useState('');
  const [loadingEditKit, setLoadingEditKit] = useState(false);

  const mostrarExitoTemporal = (mensaje) => {
    setMensajeExitoModal(mensaje);
    setTimeout(() => {
      setMensajeExitoModal('');
    }, 1300);
  };

  const extraerMensajeError = (error, porDefecto) => {
    return (
      error?.errores?.[0]?.msg ||
      error?.response?.data?.errores?.[0]?.msg ||
      error?.mensaje ||
      error?.error ||
      error?.message ||
      porDefecto
    );
  };

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

  const formatearCategoria = (cat) => {
    if (!cat) return '';
    switch (cat.toUpperCase()) {
      case 'CAMARA': return 'Cámara';
      case 'TRIPODE': return 'Trípode';
      case 'MICROFONO': return 'Micrófono';
      case 'SWITCH_VIDEO': return 'Switch de Video';
      case 'OTRO': return 'Otro';
      default: return cat;
    }
  };

  const formatearFechaInput = (fecha) => {
    if (!fecha) return fechaHoyLocal;
    const str = String(fecha).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str > fechaHoyLocal ? fechaHoyLocal : str;
    }
    return fechaHoyLocal;
  };

  const getIconoCategoria = (categoria) => {
    switch (categoria?.toUpperCase()) {
      case 'CAMARA': return <Video size={16} />;
      case 'TRIPODE': return <Sliders size={16} />;
      case 'MICROFONO': return <Mic size={16} />;
      case 'SWITCH_VIDEO': return <Monitor size={16} />;
      default: return <Box size={16} />;
    }
  };

  const renderBadgeEquipo = (estado) => {
    let clase = 'eqp-badge-gris';
    if (estado === 'OPERATIVO') clase = 'eqp-badge-verde';
    else if (estado !== 'DADO_DE_BAJA') clase = 'eqp-badge-rojo';
    return <span className={`eqp-badge ${clase}`}>{estado}</span>;
  };

  const renderBadgeKit = (estado = 'DISPONIBLE') => {
    let clase = 'eqp-badge-verde';
    if (estado === 'EN_TERRENO') clase = 'eqp-badge-azul';
    else if (estado === 'INCOMPLETO') clase = 'eqp-badge-rojo';
    return <span className={`eqp-badge ${clase}`}>{estado}</span>;
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setErrorEquipo('');

    if (name === 'valor_compra') {
      const soloDigitos = value.replace(/\D/g, '').slice(0, 9);
      setFormData({ ...formData, valor_compra: soloDigitos });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const validarDatosEquipoFormulario = (datos) => {
    const nombreLimpio = (datos.nombre || '').trim();
    if (nombreLimpio.length < 3 || nombreLimpio.length > 50) {
      return 'El nombre del equipo debe tener entre 3 y 50 caracteres.';
    }
    if (!tieneMinimoLetras(nombreLimpio, 2)) {
      return 'El nombre del equipo debe contener letras (no se permiten solo números).';
    }

    const marcaLimpia = (datos.marca || '').trim();
    if (marcaLimpia) {
      if (marcaLimpia.length < 2 || marcaLimpia.length > 35) {
        return 'La marca debe tener entre 2 y 35 caracteres.';
      }
      if (!tieneMinimoLetras(marcaLimpia, 2)) {
        return 'La marca debe contener letras válidas (no se permiten solo números).';
      }
    }

    const modeloLimpio = (datos.modelo || '').trim();
    if (modeloLimpio) {
      if (modeloLimpio.length < 2 || modeloLimpio.length > 35) {
        return 'El modelo debe tener entre 2 y 35 caracteres.';
      }
      if (!tieneMinimoLetras(modeloLimpio, 1)) {
        return 'El modelo debe incluir al menos una letra (ej: FX3, ILCE-7M4) y no ser solo números.';
      }
    }

    const fechaStr = String(datos.fecha_compra || '').slice(0, 10);
    if (!fechaStr) {
      return 'La fecha de compra es obligatoria.';
    }
    if (fechaStr > fechaHoyLocal) {
      return 'La fecha de compra no puede ser posterior al día de hoy.';
    }
    if (fechaStr < '2000-01-01') {
      return 'La fecha de compra no puede ser anterior al año 2000.';
    }

    const valorNum = Number(datos.valor_compra);
    if (!Number.isInteger(valorNum) || valorNum <= 0 || valorNum > 500000000) {
      return 'El valor de compra debe ser un número entero positivo entre $1 y $500.000.000.';
    }

    return null;
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setErrorEquipo('');

    const errorValidacion = validarDatosEquipoFormulario(formData);
    if (errorValidacion) {
      setErrorEquipo(errorValidacion);
      return;
    }

    setGuardandoEquipo(true);
    try {
      await registrarEquipo({
        ...formData,
        nombre: formData.nombre.trim(),
        marca: formData.marca ? formData.marca.trim() : null,
        modelo: formData.modelo ? formData.modelo.trim() : null,
        valor_compra: Number(formData.valor_compra)
      });

      setMostrarFormulario(false);
      setFormData({
        nombre: '',
        categoria: 'CAMARA',
        marca: '',
        modelo: '',
        fecha_compra: fechaHoyLocal,
        valor_compra: '',
        id_jefe: 1
      });
      await cargarDatos();
      mostrarExitoTemporal('Equipo registrado con éxito en el inventario');
    } catch (error) {
      setErrorEquipo(extraerMensajeError(error, 'Error al registrar el equipo.'));
    } finally {
      setGuardandoEquipo(false);
    }
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    setErrorEditarEquipo('');

    const datosParaValidar = {
      ...equipoEditando,
      fecha_compra: formatearFechaInput(equipoEditando.fecha_compra)
    };

    const errorValidacion = validarDatosEquipoFormulario(datosParaValidar);
    if (errorValidacion) {
      setErrorEditarEquipo(errorValidacion);
      return;
    }

    try {
      await actualizarEquipo(equipoEditando.codigo, {
        nombre: equipoEditando.nombre.trim(),
        categoria: equipoEditando.categoria,
        marca: equipoEditando.marca ? equipoEditando.marca.trim() : null,
        modelo: equipoEditando.modelo ? equipoEditando.modelo.trim() : null,
        fecha_compra: formatearFechaInput(equipoEditando.fecha_compra),
        valor_compra: Number(equipoEditando.valor_compra)
      });
      setEquipoEditando(null);
      await cargarDatos();
    } catch (error) {
      setErrorEditarEquipo(extraerMensajeError(error, 'Error al actualizar el equipo.'));
    }
  };

  const confirmarBaja = async (e) => {
    e.preventDefault();
    setErrorBajaEquipo('');

    const motivoLimpio = motivoBaja.trim();
    if (motivoLimpio.length < 5 || motivoLimpio.length > 120) {
      setErrorBajaEquipo('El motivo de la baja debe tener entre 5 y 120 caracteres.');
      return;
    }
    if (!tieneMinimoLetras(motivoLimpio, 3)) {
      setErrorBajaEquipo('El motivo de la baja debe describirse con palabras (no se permiten solo números).');
      return;
    }

    try {
      const resp = await darDeBajaEquipo(equipoBaja.codigo, motivoLimpio);
      if (resp?.sinHistorial && window.confirm('Este equipo no tiene historial de uso. ¿Deseas eliminarlo definitivamente?')) {
        await eliminarEquipo(equipoBaja.codigo);
      }
      setEquipoBaja(null);
      setMotivoBaja('');
      await cargarDatos();
    } catch (error) {
      setErrorBajaEquipo(extraerMensajeError(error, 'Error al procesar la baja del equipo.'));
    }
  };

  const handleSubmitCrearKit = async (e) => {
    e.preventDefault();
    setErrorKit('');

    const nombreLimpio = nombreKit.trim();
    if (nombreLimpio.length < 3 || nombreLimpio.length > 50) {
      setErrorKit('El nombre del kit debe tener entre 3 y 50 caracteres.');
      return;
    }
    if (!tieneMinimoLetras(nombreLimpio, 2)) {
      setErrorKit('El nombre del kit debe contener letras (no se permiten solo números).');
      return;
    }

    const recargoNum = Number(recargoPct);
    if (Number.isNaN(recargoNum) || recargoNum < 0 || recargoNum > 100) {
      setErrorKit('El porcentaje de recargo debe ser un valor positivo entre 0% y 100%.');
      return;
    }

    setLoadingKit(true);
    try {
      const equiposArray = [
        camaraSeleccionada,
        tripodeSeleccionado,
        microfonoSeleccionado,
        switchSeleccionado,
        ...equiposAdicionalesCrear
      ].filter(Boolean);

      const payload = {
        nombre: nombreLimpio,
        nivel: nivelKit,
        recargo_pct: recargoNum,
        equipos: equiposArray
      };

      const resultado = await kitClientService.crearKit(payload);

      setNombreKit('');
      setNivelKit('BASICO');
      setRecargoPct(0);
      setCamaraSeleccionada('');
      setTripodeSeleccionado('');
      setMicrofonoSeleccionado('');
      setSwitchSeleccionado('');
      setEquiposAdicionalesCrear([]);
      setIsModalOpen(false);

      await cargarDatos();
      mostrarExitoTemporal(resultado?.mensaje || 'Kit creado exitosamente');
    } catch (err) {
      setErrorKit(extraerMensajeError(err, 'Error al crear el kit.'));
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

    const equiposKit = kit.equipos || [];
    const camara = equiposKit.find((e) => e.categoria === 'CAMARA')?.codigo || '';
    const tripode = equiposKit.find((e) => e.categoria === 'TRIPODE')?.codigo || '';
    const microfono = equiposKit.find((e) => e.categoria === 'MICROFONO')?.codigo || '';
    const sw = equiposKit.find((e) => e.categoria === 'SWITCH_VIDEO')?.codigo || '';

    const principales = [camara, tripode, microfono, sw].filter(Boolean);
    const adicionales = equiposKit
      .map((e) => e.codigo)
      .filter((codigo) => !principales.includes(codigo));

    setCamaraEdit(camara);
    setTripodeEdit(tripode);
    setMicrofonoEdit(microfono);
    setSwitchEdit(sw);
    setEquiposAdicionalesEditar(adicionales);
  };

  const handleSubmitModificarKit = async (e) => {
    e.preventDefault();
    setErrorEditKit('');

    const nombreLimpio = nombreEditKit.trim();
    if (nombreLimpio.length < 3 || nombreLimpio.length > 50) {
      setErrorEditKit('El nombre del kit debe tener entre 3 y 50 caracteres.');
      return;
    }
    if (!tieneMinimoLetras(nombreLimpio, 2)) {
      setErrorEditKit('El nombre del kit debe contener letras (no se permiten solo números).');
      return;
    }

    const recargoNum = Number(recargoEditPct);
    if (Number.isNaN(recargoNum) || recargoNum < 0 || recargoNum > 100) {
      setErrorEditKit('El porcentaje de recargo debe estar entre 0% y 100%.');
      return;
    }

    setLoadingEditKit(true);

    try {
      const equiposArray = [
        camaraEdit,
        tripodeEdit,
        microfonoEdit,
        switchEdit,
        ...equiposAdicionalesEditar
      ].filter(Boolean);

      // RF-P5-05: Si el kit está EN_TERRENO, solo enviamos nombre/nivel/recargo sin tocar sus equipos
      const payload =
        kitEditando.estado === 'EN_TERRENO'
          ? {
              nombre: nombreLimpio,
              nivel: nivelEditKit,
              recargo_pct: recargoNum
            }
          : {
              nombre: nombreLimpio,
              nivel: nivelEditKit,
              recargo_pct: recargoNum,
              equipos: equiposArray
            };

      await kitClientService.actualizarKit(kitEditando.id_kit, payload);
      setKitEditando(null);
      await cargarDatos();
    } catch (err) {
      setErrorEditKit(extraerMensajeError(err, 'Error al actualizar el kit.'));
    } finally {
      setLoadingEditKit(false);
    }
  };

  // --- LÓGICA DE ELIMINAR KIT (RF-P5-06) ---
  const manejarEliminarKit = async (idKit, nombreDelKit) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el kit "${nombreDelKit}"? Sus equipos pasarán a ser repuestos.`)) {
      return;
    }
    try {
      await kitClientService.eliminarKit(idKit);
      await cargarDatos();
    } catch (err) {
      alert(extraerMensajeError(err, 'Error al eliminar el kit.'));
    }
  };

  // RF-P5-07: Equipos libres y operativos (Repuestos reales)
  const equiposDisponiblesParaKit = listaEquipos.filter(
    (eq) => eq.estado?.toUpperCase() === 'OPERATIVO' && !eq.id_kit && !eq.kit
  );

  const camerasDisponibles = equiposDisponiblesParaKit.filter((eq) => eq.categoria?.toUpperCase() === 'CAMARA');
  const tripodesDisponibles = equiposDisponiblesParaKit.filter((eq) => eq.categoria?.toUpperCase() === 'TRIPODE');
  const microfonosDisponibles = equiposDisponiblesParaKit.filter((eq) => eq.categoria?.toUpperCase() === 'MICROFONO');
  const switchesDisponibles = equiposDisponiblesParaKit.filter((eq) => eq.categoria?.toUpperCase() === 'SWITCH_VIDEO');

  const obtenerEquiposParaEdicion = () => {
    return listaEquipos.filter((eq) => {
      const esOperativo = eq.estado?.toUpperCase() === 'OPERATIVO';
      const estaLibre = !eq.id_kit && !eq.kit;
      const perteneceAEsteKit = kitEditando?.equipos?.some((e) => e.codigo === eq.codigo);
      return esOperativo && (estaLibre || perteneceAEsteKit);
    });
  };

  const equiposFiltrados = listaEquipos.filter((eq) => {
    if (filtroCategoria === 'TODOS') return true;
    return eq.categoria?.toUpperCase() === filtroCategoria;
  });

  return (
    <div className="eqp-pagina">
      {/* CABECERA */}
      <div className="eqp-encabezado">
        <h1>Gestión de Kits y Equipos</h1>
        <p>Administración de kits técnicos, niveles de servicio y catálogo de inventario general</p>
      </div>

      {/* PANEL CONTENEDOR */}
      <div className="eqp-panel">
        {/* PESTAÑAS Y BOTÓN PRINCIPAL */}
        <div className="eqp-tabs-bar">
          <div className="eqp-tabs-grupo">
            <button
              type="button"
              onClick={() => setActiveTab('KITS')}
              className={`eqp-tab ${activeTab === 'KITS' ? 'activa' : ''}`}
            >
              KITS
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('EQUIPOS')}
              className={`eqp-tab ${activeTab === 'EQUIPOS' ? 'activa' : ''}`}
            >
              EQUIPOS
            </button>
          </div>

          {activeTab === 'KITS' ? (
            <button
              type="button"
              onClick={() => {
                setErrorKit('');
                setIsModalOpen(true);
              }}
              className="eqp-btn-nuevo"
            >
              <Plus size={18} />
              <span>Crear kit</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setErrorEquipo('');
                setFormData({
                  nombre: '',
                  categoria: 'CAMARA',
                  marca: '',
                  modelo: '',
                  fecha_compra: fechaHoyLocal,
                  valor_compra: '',
                  id_jefe: 1
                });
                setMostrarFormulario(true);
              }}
              className="eqp-btn-nuevo"
            >
              <Plus size={18} />
              <span>Registrar nuevo equipo</span>
            </button>
          )}
        </div>

        {/* ================= VISTA KITS ================= */}
        {activeTab === 'KITS' && (
          <div>
            {kits.length === 0 ? (
              <div className="eqp-vacio-kits">
                <Box size={40} className="eqp-vacio-icono" />
                <h3>No hay kits creados</h3>
                <p>Haz clic en &ldquo;+ Crear kit&rdquo; para armar el primer kit con equipos operativos del inventario.</p>
              </div>
            ) : (
              <div className="eqp-kits-grid">
                {kits.map((kit) => (
                  <div key={kit.id_kit} className="eqp-kit-card">
                    <div className="eqp-kit-cab">
                      <div>
                        <h3 className="eqp-kit-titulo">{kit.nombre}</h3>
                        <p className="eqp-kit-sub">
                          {kit.nivel} · Recargo: {kit.recargo_pct}%
                        </p>
                      </div>
                      <div className="eqp-kit-acciones">
                        <button
                          type="button"
                          onClick={() => iniciarEdicionKit(kit)}
                          className="eqp-btn-sec-chico"
                        >
                          Modificar
                        </button>
                        <button
                          type="button"
                          onClick={() => manejarEliminarKit(kit.id_kit, kit.nombre)}
                          className="eqp-btn-peligro-chico"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    <div className="eqp-kit-equipos-grid">
                      {kit.equipos?.map((eq, idx) => (
                        <div key={idx} className="eqp-kit-eq-item">
                          <div className="eqp-kit-eq-icono">
                            {getIconoCategoria(eq.categoria)}
                          </div>
                          <div className="eqp-kit-eq-info">
                            <p className="eqp-kit-eq-nombre">{eq.nombre}</p>
                            <p className="eqp-kit-eq-cat">{formatearCategoria(eq.categoria)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="eqp-kit-pie">
                      {renderBadgeKit(kit.estado || 'DISPONIBLE')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= VISTA EQUIPOS / INVENTARIO ================= */}
        {activeTab === 'EQUIPOS' && (
          <div>
            <div className="eqp-seccion-cab">
              <div>
                <h2 className="eqp-seccion-titulo">Inventario de Equipos</h2>
                <p className="eqp-seccion-sub">
                  Listado de equipos registrados, código correlativo y estado de asignación
                </p>
              </div>
              <div>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="eqp-filtro-select"
                >
                  <option value="TODOS">Todas las categorías</option>
                  <option value="CAMARA">Cámara</option>
                  <option value="TRIPODE">Trípode</option>
                  <option value="MICROFONO">Micrófono</option>
                  <option value="SWITCH_VIDEO">Switch de Video</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
            </div>

            {cargando ? (
              <p className="eqp-cargando">Cargando inventario...</p>
            ) : equiposFiltrados.length === 0 ? (
              <div className="eqp-vacio-tabla">
                <p>No hay equipos registrados en esta categoría.</p>
              </div>
            ) : (
              <div className="eqp-tabla-scroll">
                <table className="eqp-tabla">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Equipo</th>
                      <th>Categoría</th>
                      <th>Marca / Modelo</th>
                      <th>Fecha Compra</th>
                      <th className="eqp-th-der">Valor Compra</th>
                      <th className="eqp-th-centro">Estado</th>
                      <th className="eqp-th-centro">Kit</th>
                      <th className="eqp-th-centro">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equiposFiltrados.map((eq) => {
                      const fecha = formatearFechaTabla(eq.fecha_compra);
                      const esBaja = eq.estado === 'DADO_DE_BAJA';
                      const esRepuesto = eq.estado === 'OPERATIVO' && !eq.kit && !eq.id_kit;
                      return (
                        <tr
                          key={eq.codigo}
                          className={`eqp-tr ${esBaja ? 'eqp-tr-baja' : ''}`}
                        >
                          <td className="eqp-td-codigo">{eq.codigo}</td>
                          <td className="eqp-td-nombre">{eq.nombre}</td>
                          <td className="eqp-td-cat">{formatearCategoria(eq.categoria)}</td>
                          <td className="eqp-td-marca">
                            {eq.marca || '-'} {eq.modelo ? `(${eq.modelo})` : ''}
                          </td>
                          <td className="eqp-td-fecha">{fecha}</td>
                          <td className="eqp-td-valor">
                            ${Number(eq.valor_compra || 0).toLocaleString('es-CL')}
                          </td>
                          <td className="eqp-td-centro">{renderBadgeEquipo(eq.estado)}</td>
                          <td
                            className={
                              eq.kit ? 'eqp-td-kit-asignado' : 'eqp-td-kit-libre'
                            }
                          >
                            {eq.kit?.nombre ||
                              eq.kit ||
                              (esRepuesto ? 'Repuesto (Sin kit)' : 'Sin kit (No operativo)')}
                          </td>
                          <td className="eqp-td-centro">
                            <div className="eqp-acciones-fila">
                              <button
                                type="button"
                                onClick={() => {
                                  setErrorEditarEquipo('');
                                  setEquipoEditando(eq);
                                }}
                                className="eqp-btn-sec-chico"
                              >
                                Modificar
                              </button>
                              {!esBaja && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setErrorBajaEquipo('');
                                    setMotivoBaja('');
                                    setEquipoBaja(eq);
                                  }}
                                  className="eqp-btn-peligro-chico"
                                >
                                  Retirar
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
      </div>

      {/* ================= MODAL DE ÉXITO (SOLO AL CREAR) ================= */}
      {mensajeExitoModal && (
        <div className="eqp-modal-fondo">
          <div className="eqp-modal-exito">
            <div className="eqp-modal-exito-contenido">
              <FaCheckCircle className="eqp-icono-exito" />
              <h2 className="eqp-modal-exito-titulo">¡Operación Exitosa!</h2>
              <p className="eqp-modal-exito-texto">{mensajeExitoModal}</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL REGISTRAR NUEVO EQUIPO ================= */}
      {mostrarFormulario && (
        <div className="eqp-modal-fondo">
          <div className="eqp-modal-caja">
            <h2 className="eqp-modal-titulo">Registrar Equipo en Inventario</h2>
            <p className="eqp-modal-sub">
              El sistema generará automáticamente el código único según la categoría y asignará el estado Operativo.
            </p>

            {errorEquipo && (
              <div className="eqp-alerta-error">
                <AlertTriangle size={16} className="eqp-alerta-icono" />
                <span>{errorEquipo}</span>
              </div>
            )}

            <form onSubmit={manejarEnvio} className="eqp-form">
              <div>
                <label className="eqp-label">Nombre del equipo:</label>
                <input
                  type="text"
                  name="nombre"
                  maxLength={50}
                  placeholder="Ej: Cámara Sony Alpha 7 IV"
                  value={formData.nombre}
                  onChange={manejarCambio}
                  required
                  className="eqp-input"
                />
              </div>

              <div className="eqp-form-fila">
                <div>
                  <label className="eqp-label">Categoría:</label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={manejarCambio}
                    className="eqp-select"
                  >
                    <option value="CAMARA">Cámara</option>
                    <option value="TRIPODE">Trípode</option>
                    <option value="MICROFONO">Micrófono</option>
                    <option value="SWITCH_VIDEO">Switch de Video</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="eqp-label">Marca:</label>
                  <input
                    type="text"
                    name="marca"
                    maxLength={35}
                    placeholder="Ej: Sony"
                    value={formData.marca}
                    onChange={manejarCambio}
                    className="eqp-input"
                  />
                </div>
              </div>

              <div className="eqp-form-fila">
                <div>
                  <label className="eqp-label">Modelo:</label>
                  <input
                    type="text"
                    name="modelo"
                    maxLength={35}
                    placeholder="Ej: ILCE-7M4"
                    value={formData.modelo}
                    onChange={manejarCambio}
                    className="eqp-input"
                  />
                </div>

                <div>
                  <label className="eqp-label">Fecha de compra:</label>
                  <input
                    type="date"
                    name="fecha_compra"
                    lang="es-CL"
                    min="2000-01-01"
                    max={fechaHoyLocal}
                    value={formData.fecha_compra}
                    onChange={manejarCambio}
                    required
                    className="eqp-input"
                  />
                </div>
              </div>

              <div>
                <label className="eqp-label">Valor de compra ($):</label>
                <input
                  type="number"
                  name="valor_compra"
                  min="1"
                  max="500000000"
                  placeholder="Ej: 1800000"
                  value={formData.valor_compra}
                  onKeyDown={bloquearNegativosEnteros}
                  onChange={manejarCambio}
                  required
                  className="eqp-input"
                />
              </div>

              <div className="eqp-modal-pie">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="eqp-btn-cancelar"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEquipo}
                  className="eqp-btn-guardar"
                >
                  {guardandoEquipo ? 'Guardando...' : 'Guardar Equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL MODIFICAR EQUIPO ================= */}
      {equipoEditando && (
        <div className="eqp-modal-fondo">
          <div className="eqp-modal-caja">
            <h2 className="eqp-modal-titulo">Modificar Equipo: {equipoEditando.codigo}</h2>
            <p className="eqp-modal-sub">
              Actualiza los datos generales del equipo (la categoría se mantiene fija).
            </p>

            {errorEditarEquipo && (
              <div className="eqp-alerta-error">
                <AlertTriangle size={16} className="eqp-alerta-icono" />
                <span>{errorEditarEquipo}</span>
              </div>
            )}

            <form onSubmit={guardarEdicion} className="eqp-form">
              <div>
                <label className="eqp-label">Nombre del equipo:</label>
                <input
                  type="text"
                  name="nombre"
                  maxLength={50}
                  value={equipoEditando.nombre || ''}
                  onChange={(e) => {
                    setErrorEditarEquipo('');
                    setEquipoEditando({ ...equipoEditando, nombre: e.target.value });
                  }}
                  required
                  className="eqp-input"
                />
              </div>

              <div className="eqp-form-fila">
                <div>
                  <label className="eqp-label">Categoría (Fija):</label>
                  <input
                    type="text"
                    value={formatearCategoria(equipoEditando.categoria)}
                    disabled
                    readOnly
                    className="eqp-input"
                  />
                </div>

                <div>
                  <label className="eqp-label">Marca:</label>
                  <input
                    type="text"
                    name="marca"
                    maxLength={35}
                    value={equipoEditando.marca || ''}
                    onChange={(e) => {
                      setErrorEditarEquipo('');
                      setEquipoEditando({ ...equipoEditando, marca: e.target.value });
                    }}
                    className="eqp-input"
                  />
                </div>
              </div>

              <div className="eqp-form-fila">
                <div>
                  <label className="eqp-label">Modelo:</label>
                  <input
                    type="text"
                    name="modelo"
                    maxLength={35}
                    value={equipoEditando.modelo || ''}
                    onChange={(e) => {
                      setErrorEditarEquipo('');
                      setEquipoEditando({ ...equipoEditando, modelo: e.target.value });
                    }}
                    className="eqp-input"
                  />
                </div>

                <div>
                  <label className="eqp-label">Fecha de compra:</label>
                  <input
                    type="date"
                    name="fecha_compra"
                    lang="es-CL"
                    min="2000-01-01"
                    max={fechaHoyLocal}
                    value={formatearFechaInput(equipoEditando.fecha_compra)}
                    onChange={(e) => {
                      setErrorEditarEquipo('');
                      setEquipoEditando({ ...equipoEditando, fecha_compra: e.target.value });
                    }}
                    required
                    className="eqp-input"
                  />
                </div>
              </div>

              <div>
                <label className="eqp-label">Valor de compra ($):</label>
                <input
                  type="number"
                  name="valor_compra"
                  min="1"
                  max="500000000"
                  value={equipoEditando.valor_compra || ''}
                  onKeyDown={bloquearNegativosEnteros}
                  onChange={(e) => {
                    setErrorEditarEquipo('');
                    const soloDigitos = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setEquipoEditando({ ...equipoEditando, valor_compra: soloDigitos });
                  }}
                  required
                  className="eqp-input"
                />
              </div>

              <div className="eqp-modal-pie">
                <button
                  type="button"
                  onClick={() => setEquipoEditando(null)}
                  className="eqp-btn-cancelar"
                >
                  Cancelar
                </button>
                <button type="submit" className="eqp-btn-guardar">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DAR DE BAJA / ELIMINAR EQUIPO ================= */}
      {equipoBaja && (
        <div className="eqp-modal-fondo">
          <div className="eqp-modal-caja eqp-modal-caja-chica">
            <h2 className="eqp-modal-titulo-rojo">Retirar: {equipoBaja.codigo}</h2>
            <p className="eqp-modal-sub">
              Indica el motivo por el cual el equipo deja de estar operativo.
            </p>

            {errorBajaEquipo && (
              <div className="eqp-alerta-error">
                <AlertTriangle size={16} className="eqp-alerta-icono" />
                <span>{errorBajaEquipo}</span>
              </div>
            )}

            <form onSubmit={confirmarBaja} className="eqp-form">
              <textarea
                rows="3"
                maxLength={120}
                value={motivoBaja}
                onChange={(e) => {
                  setErrorBajaEquipo('');
                  setMotivoBaja(e.target.value);
                }}
                placeholder="Ej: Falla irreparable en el sensor principal..."
                required
                className="eqp-textarea"
              />
              <div className="eqp-modal-pie">
                <button
                  type="button"
                  onClick={() => setEquipoBaja(null)}
                  className="eqp-btn-cancelar"
                >
                  Cancelar
                </button>
                <button type="submit" className="eqp-btn-confirmar-baja">
                  Confirmar Baja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CREAR KIT ================= */}
      {isModalOpen && (
        <div className="eqp-modal-fondo">
          <div className="eqp-modal-caja">
            <h2 className="eqp-modal-titulo">Crear Nuevo Kit</h2>
            <p className="eqp-modal-sub">
              Selecciona los equipos base obligatorios y añade más equipos adicionales si lo necesitas.
            </p>

            {errorKit && (
              <div className="eqp-alerta-error">
                <AlertTriangle size={16} className="eqp-alerta-icono" />
                <span>{errorKit}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCrearKit} className="eqp-form">
              <div>
                <label className="eqp-label">Nombre del Kit:</label>
                <input
                  type="text"
                  maxLength={50}
                  required
                  value={nombreKit}
                  onChange={(e) => {
                    setErrorKit('');
                    setNombreKit(e.target.value);
                  }}
                  placeholder="Ej. Kit Audiovisual Pro"
                  className="eqp-input"
                />
              </div>

              <div className="eqp-form-fila">
                <div>
                  <label className="eqp-label">Nivel:</label>
                  <select
                    value={nivelKit}
                    onChange={(e) => setNivelKit(e.target.value)}
                    className="eqp-select"
                  >
                    <option value="BASICO">Básico</option>
                    <option value="ESTANDAR">Estándar</option>
                    <option value="ALTA_GAMA">Alta Gama</option>
                  </select>
                </div>

                <div>
                  <label className="eqp-label">Recargo (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={recargoPct}
                    onKeyDown={bloquearNegativosDecimal}
                    onChange={(e) => {
                      setErrorKit('');
                      setRecargoPct(e.target.value);
                    }}
                    className="eqp-input"
                  />
                </div>
              </div>

              {/* 4 SELECTORES PRINCIPALES OBLIGATORIOS */}
              <div className="eqp-form-fila">
                <div className="eqp-campo-col">
                  <label className="eqp-label-fuerte">Cámara (Obligatorio):</label>
                  <select
                    value={camaraSeleccionada}
                    onChange={(e) => setCamaraSeleccionada(e.target.value)}
                    required
                    className="eqp-select"
                  >
                    <option value="">-- Seleccione Cámara --</option>
                    {camerasDisponibles.map((eq) => (
                      <option key={eq.codigo} value={eq.codigo}>
                        {eq.codigo} - {eq.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="eqp-campo-col">
                  <label className="eqp-label-fuerte">Trípode (Obligatorio):</label>
                  <select
                    value={tripodeSeleccionado}
                    onChange={(e) => setTripodeSeleccionado(e.target.value)}
                    required
                    className="eqp-select"
                  >
                    <option value="">-- Seleccione Trípode --</option>
                    {tripodesDisponibles.map((eq) => (
                      <option key={eq.codigo} value={eq.codigo}>
                        {eq.codigo} - {eq.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="eqp-campo-col">
                  <label className="eqp-label-fuerte">Micrófono (Obligatorio):</label>
                  <select
                    value={microfonoSeleccionado}
                    onChange={(e) => setMicrofonoSeleccionado(e.target.value)}
                    required
                    className="eqp-select"
                  >
                    <option value="">-- Seleccione Micrófono --</option>
                    {microfonosDisponibles.map((eq) => (
                      <option key={eq.codigo} value={eq.codigo}>
                        {eq.codigo} - {eq.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="eqp-campo-col">
                  <label className="eqp-label-fuerte">Switch de video (Obligatorio):</label>
                  <select
                    value={switchSeleccionado}
                    onChange={(e) => setSwitchSeleccionado(e.target.value)}
                    required
                    className="eqp-select"
                  >
                    <option value="">-- Seleccione Switch --</option>
                    {switchesDisponibles.map((eq) => (
                      <option key={eq.codigo} value={eq.codigo}>
                        {eq.codigo} - {eq.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* EQUIPOS ADICIONALES */}
              <div className="eqp-adicionales-bloque">
                <div className="eqp-adicionales-cab">
                  <label className="eqp-label-fuerte">Equipos Adicionales (Opcional):</label>
                  <button
                    type="button"
                    onClick={() => setEquiposAdicionalesCrear([...equiposAdicionalesCrear, ''])}
                    className="eqp-btn-anadir-extra"
                  >
                    <Plus size={14} />
                    <span>Añadir equipo</span>
                  </button>
                </div>

                {equiposAdicionalesCrear.map((codigoAdicional, index) => {
                  const codigosYaUsados = [
                    camaraSeleccionada,
                    tripodeSeleccionado,
                    microfonoSeleccionado,
                    switchSeleccionado,
                    ...equiposAdicionalesCrear
                  ];
                  const disponiblesExtra = equiposDisponiblesParaKit.filter(
                    (eq) => !codigosYaUsados.includes(eq.codigo) || eq.codigo === codigoAdicional
                  );

                  return (
                    <div key={index} className="eqp-adicional-fila">
                      <select
                        value={codigoAdicional}
                        onChange={(e) => {
                          const nuevos = [...equiposAdicionalesCrear];
                          nuevos[index] = e.target.value;
                          setEquiposAdicionalesCrear(nuevos);
                        }}
                        required
                        className="eqp-adicional-select"
                      >
                        <option value="">-- Seleccionar equipo adicional --</option>
                        {disponiblesExtra.map((eq) => (
                          <option key={eq.codigo} value={eq.codigo}>
                            {eq.codigo} - {eq.nombre} ({formatearCategoria(eq.categoria)})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const nuevos = equiposAdicionalesCrear.filter((_, i) => i !== index);
                          setEquiposAdicionalesCrear(nuevos);
                        }}
                        className="eqp-btn-quitar-extra"
                        aria-label="Quitar equipo adicional"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="eqp-modal-pie">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="eqp-btn-cancelar"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingKit}
                  className="eqp-btn-guardar"
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
        <div className="eqp-modal-fondo">
          <div className="eqp-modal-caja eqp-modal-caja-amplia">
            <h2 className="eqp-modal-titulo">Modificar Kit: {kitEditando.nombre}</h2>
            <p className="eqp-modal-sub">Actualiza la información o los equipos del kit.</p>

            {kitEditando.estado === 'EN_TERRENO' && (
              <div className="eqp-alerta-terreno">
                Este kit está en terreno: solo puedes modificar su nombre, nivel o recargo (la composición de equipos se mantiene bloqueada).
              </div>
            )}

            {errorEditKit && (
              <div className="eqp-alerta-error">
                <AlertTriangle size={16} className="eqp-alerta-icono" />
                <span>{errorEditKit}</span>
              </div>
            )}

            <form onSubmit={handleSubmitModificarKit} className="eqp-form">
              <div>
                <label className="eqp-label">Nombre del Kit:</label>
                <input
                  type="text"
                  maxLength={50}
                  required
                  value={nombreEditKit}
                  onChange={(e) => {
                    setErrorEditKit('');
                    setNombreEditKit(e.target.value);
                  }}
                  className="eqp-input"
                />
              </div>

              <div className="eqp-form-fila">
                <div>
                  <label className="eqp-label">Nivel:</label>
                  <select
                    value={nivelEditKit}
                    onChange={(e) => setNivelEditKit(e.target.value)}
                    className="eqp-select"
                  >
                    <option value="BASICO">Básico</option>
                    <option value="ESTANDAR">Estándar</option>
                    <option value="ALTA_GAMA">Alta Gama</option>
                  </select>
                </div>

                <div>
                  <label className="eqp-label">Recargo (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={recargoEditPct}
                    onKeyDown={bloquearNegativosDecimal}
                    onChange={(e) => {
                      setErrorEditKit('');
                      setRecargoEditPct(e.target.value);
                    }}
                    className="eqp-input"
                  />
                </div>
              </div>

              <div className="eqp-form-fila">
                <div className="eqp-campo-col">
                  <label className="eqp-label-fuerte">Cámara:</label>
                  <select
                    value={camaraEdit}
                    onChange={(e) => setCamaraEdit(e.target.value)}
                    disabled={kitEditando.estado === 'EN_TERRENO'}
                    required
                    className="eqp-select"
                  >
                    <option value="">-- Seleccione Cámara --</option>
                    {obtenerEquiposParaEdicion()
                      .filter((eq) => eq.categoria === 'CAMARA' || eq.codigo === camaraEdit)
                      .map((eq) => (
                        <option key={eq.codigo} value={eq.codigo}>
                          {eq.codigo} - {eq.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="eqp-campo-col">
                  <label className="eqp-label-fuerte">Trípode:</label>
                  <select
                    value={tripodeEdit}
                    onChange={(e) => setTripodeEdit(e.target.value)}
                    disabled={kitEditando.estado === 'EN_TERRENO'}
                    required
                    className="eqp-select"
                  >
                    <option value="">-- Seleccione Trípode --</option>
                    {obtenerEquiposParaEdicion()
                      .filter((eq) => eq.categoria === 'TRIPODE' || eq.codigo === tripodeEdit)
                      .map((eq) => (
                        <option key={eq.codigo} value={eq.codigo}>
                          {eq.codigo} - {eq.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="eqp-campo-col">
                  <label className="eqp-label-fuerte">Micrófono:</label>
                  <select
                    value={microfonoEdit}
                    onChange={(e) => setMicrofonoEdit(e.target.value)}
                    disabled={kitEditando.estado === 'EN_TERRENO'}
                    required
                    className="eqp-select"
                  >
                    <option value="">-- Seleccione Micrófono --</option>
                    {obtenerEquiposParaEdicion()
                      .filter((eq) => eq.categoria === 'MICROFONO' || eq.codigo === microfonoEdit)
                      .map((eq) => (
                        <option key={eq.codigo} value={eq.codigo}>
                          {eq.codigo} - {eq.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="eqp-campo-col">
                  <label className="eqp-label-fuerte">Switch de video:</label>
                  <select
                    value={switchEdit}
                    onChange={(e) => setSwitchEdit(e.target.value)}
                    disabled={kitEditando.estado === 'EN_TERRENO'}
                    required
                    className="eqp-select"
                  >
                    <option value="">-- Seleccione Switch --</option>
                    {obtenerEquiposParaEdicion()
                      .filter((eq) => eq.categoria === 'SWITCH_VIDEO' || eq.codigo === switchEdit)
                      .map((eq) => (
                        <option key={eq.codigo} value={eq.codigo}>
                          {eq.codigo} - {eq.nombre}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* ADICIONALES EN EDICIÓN */}
              <div className="eqp-adicionales-bloque">
                <div className="eqp-adicionales-cab">
                  <label className="eqp-label-fuerte">Equipos Adicionales:</label>
                  {kitEditando.estado !== 'EN_TERRENO' && (
                    <button
                      type="button"
                      onClick={() => setEquiposAdicionalesEditar([...equiposAdicionalesEditar, ''])}
                      className="eqp-btn-anadir-extra"
                    >
                      <Plus size={14} />
                      <span>Añadir equipo</span>
                    </button>
                  )}
                </div>

                {equiposAdicionalesEditar.map((codigoAdicional, index) => {
                  const codigosUsados = [
                    camaraEdit,
                    tripodeEdit,
                    microfonoEdit,
                    switchEdit,
                    ...equiposAdicionalesEditar
                  ];
                  const disponiblesExtra = obtenerEquiposParaEdicion().filter(
                    (eq) => !codigosUsados.includes(eq.codigo) || eq.codigo === codigoAdicional
                  );

                  return (
                    <div key={index} className="eqp-adicional-fila">
                      <select
                        value={codigoAdicional}
                        disabled={kitEditando.estado === 'EN_TERRENO'}
                        onChange={(e) => {
                          const nuevos = [...equiposAdicionalesEditar];
                          nuevos[index] = e.target.value;
                          setEquiposAdicionalesEditar(nuevos);
                        }}
                        required
                        className="eqp-adicional-select"
                      >
                        <option value="">-- Seleccionar equipo adicional --</option>
                        {disponiblesExtra.map((eq) => (
                          <option key={eq.codigo} value={eq.codigo}>
                            {eq.codigo} - {eq.nombre} ({formatearCategoria(eq.categoria)})
                          </option>
                        ))}
                      </select>
                      {kitEditando.estado !== 'EN_TERRENO' && (
                        <button
                          type="button"
                          onClick={() => {
                            const nuevos = equiposAdicionalesEditar.filter((_, i) => i !== index);
                            setEquiposAdicionalesEditar(nuevos);
                          }}
                          className="eqp-btn-quitar-extra"
                          aria-label="Quitar equipo adicional"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="eqp-modal-pie">
                <button
                  type="button"
                  onClick={() => setKitEditando(null)}
                  className="eqp-btn-cancelar"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingEditKit}
                  className="eqp-btn-guardar"
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