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

// Fecha actual en formato local YYYY-MM-DD para restringir inputs date
const obtenerFechaHoyLocal = () => {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

// Formatea fechas ISO ("2026-11-20T...") a "DD-MM-YYYY" sin desfase de zona horaria ni error 1969
const formatearFechaEvento = (valorFecha) => {
  if (!valorFecha) return '';
  const iso = String(valorFecha).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || iso.startsWith('1969') || iso.startsWith('1970')) {
    return '';
  }
  const [a, m, d] = iso.split('-');
  return `${d}-${m}-${a}`;
};

// Impide escribir signos negativos, decimales o notación científica en campos numéricos enteros
const bloquearNegativosTeclado = (e) => {
  if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
    e.preventDefault();
  }
};

// Valida que un texto contenga al menos N letras reales (evita que pongan solo números como "222222")
const tieneMinimoLetras = (texto, minLetras = 3) => {
  const limpio = String(texto || '').trim();
  const coincidencias = limpio.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g) || [];
  return coincidencias.length >= minLetras;
};

export default function Auspiciadores() {
  const fechaHoyLocal = obtenerFechaHoyLocal();

  // Detectar rol e identificador real desde localStorage (o decodificando el token JWT si existe)
  const usuarioActual = useMemo(() => {
    try {
      const claves = ['usuario', 'sesion', 'user', 'auth'];
      for (const clave of claves) {
        const guardado = localStorage.getItem(clave);
        if (guardado) {
          const parseado = JSON.parse(guardado);
          const u = parseado?.usuario || parseado?.user || parseado;
          if (u && (u.rol || u.id || u.id_dueno || u.id_contador)) {
            return u;
          }
        }
      }
      const token = localStorage.getItem('token');
      if (token && token.includes('.')) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload?.usuario || payload || { rol: 'DUENO', id: 1 };
      }
      return { rol: 'DUENO', id: 1 };
    } catch {
      return { rol: 'DUENO', id: 1 };
    }
  }, []);

  const rolUsuario = String(usuarioActual.rol || 'DUENO').toUpperCase();
  const esDueno = rolUsuario === 'DUENO';
  const esContador = rolUsuario === 'CONTADOR';
  const idDuenoActual =
    esDueno && (usuarioActual.id_dueno || usuarioActual.id)
      ? Number(usuarioActual.id_dueno || usuarioActual.id)
      : 1;
  const idContadorActual =
    esContador && (usuarioActual.id_contador || usuarioActual.id)
      ? Number(usuarioActual.id_contador || usuarioActual.id)
      : undefined;

  const [formData, setFormData] = useState({
    nombre: '',
    rubro: '',
    contacto: '',
    telefono: '',
    id_dueno: idDuenoActual
  });

  const [idEditando, setIdEditando] = useState(null);
  const [mensajeExitoModal, setMensajeExitoModal] = useState('');
  const [errorModal, setErrorModal] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Modal para Registrar Acuerdo
  const [mostrarModalAcuerdo, setMostrarModalAcuerdo] = useState(false);
  const [formAcuerdo, setFormAcuerdo] = useState({
    id_auspiciador: '',
    id_evento: '',
    tipo_aporte: 'DINERO',
    monto_comprometido: '',
    descripcion_canje: '',
    cant_menciones: '',
    fecha_comprometida: fechaHoyLocal,
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
    fecha_recibida: fechaHoyLocal
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
    fecha_comprometida: fechaHoyLocal
  });

  const mostrarExitoTemporal = (mensaje) => {
    setMensajeExitoModal(mensaje);
    setTimeout(() => {
      setMensajeExitoModal('');
    }, 1300);
  };

  const extraerMensajeError = (error, mensajePorDefecto) => {
    return (
      error?.errores?.[0]?.msg ||
      error?.response?.data?.errores?.[0]?.msg ||
      error?.mensaje ||
      error?.error ||
      error?.message ||
      mensajePorDefecto
    );
  };

  // Calcula el historial de cumplimiento de un auspiciador sin parciales (RF-P4-03 y RF-P4-07)
  const obtenerResumenHistorialAuspiciador = (idAuspiciador) => {
    const acuerdosDeAusp = listaAcuerdos.filter(
      (a) => String(a.id_auspiciador || a.auspiciador?.id_auspiciador) === String(idAuspiciador)
    );
    return {
      total: acuerdosDeAusp.length,
      cumplidos: acuerdosDeAusp.filter((a) => a.estado === 'CUMPLIDO' || a.estado === 'PARCIAL').length,
      vencidos: acuerdosDeAusp.filter((a) => a.estado === 'VENCIDO').length,
      incobrables: acuerdosDeAusp.filter((a) => a.estado === 'INCOBRABLE').length
    };
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

  // Filtro en tiempo real para el formulario de Auspiciador
  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setErrorModal('');

    if (name === 'rubro' || name === 'contacto') {
      const soloLetras = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.,'-]/g, '');
      setFormData({ ...formData, [name]: soloLetras });
      return;
    }

    if (name === 'telefono') {
      const limpio = value.replace(/(?!^\+)[^\d]/g, '');
      setFormData({ ...formData, telefono: limpio });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const manejarCambioNuevoAcuerdo = (e) => {
    const { name, value } = e.target;
    setErrorModal('');
    setFormAcuerdo({ ...formAcuerdo, [name]: value });
  };

  // Detecta si el auspiciador elegido en el modal de nuevo acuerdo es NO_CONFIABLE
  const auspiciadorElegidoAcuerdo = useMemo(() => {
    if (!formAcuerdo.id_auspiciador) return null;
    return listaAuspiciadores.find(
      (a) => String(a.id_auspiciador || a.id) === String(formAcuerdo.id_auspiciador)
    );
  }, [formAcuerdo.id_auspiciador, listaAuspiciadores]);

  const historialAuspiciadorElegido = useMemo(() => {
    if (!auspiciadorElegidoAcuerdo) return null;
    const id = auspiciadorElegidoAcuerdo.id_auspiciador || auspiciadorElegidoAcuerdo.id;
    return obtenerResumenHistorialAuspiciador(id);
  }, [auspiciadorElegidoAcuerdo, listaAcuerdos]);

  const historialModalClasificacion = useMemo(() => {
    if (!modalClasificacion.auspiciador) return null;
    const id = modalClasificacion.auspiciador.id_auspiciador || modalClasificacion.auspiciador.id;
    return obtenerResumenHistorialAuspiciador(id);
  }, [modalClasificacion.auspiciador, listaAcuerdos]);

  // Solo permite seleccionar eventos desde hoy en adelante y que no estén realizados ni cerrados (RF-P4-02)
  const eventosAbiertos = useMemo(() => {
    return listaEventos.filter((ev) => {
      if (ev.estado === 'CERRADO' || ev.estado === 'REALIZADO') return false;
      if (!ev.fecha) return false;
      const fechaIso = String(ev.fecha).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaIso) || fechaIso.startsWith('1969') || fechaIso.startsWith('1970')) {
        return false;
      }
      return fechaIso >= fechaHoyLocal;
    });
  }, [listaEventos, fechaHoyLocal]);

  const iniciarEdicion = (item) => {
    setErrorModal('');
    setMostrarFormulario(true);
    setIdEditando(item.id_auspiciador || item.id);
    setFormData({
      nombre: item.nombre || '',
      rubro: item.rubro || '',
      contacto: item.contacto || '',
      telefono: item.telefono || '',
      id_dueno: item.id_dueno || idDuenoActual
    });
  };

  const cancelarEdicion = () => {
    setErrorModal('');
    setIdEditando(null);
    setFormData({
      nombre: '',
      rubro: '',
      contacto: '',
      telefono: '',
      id_dueno: idDuenoActual
    });
    setMostrarFormulario(false);
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setErrorModal('');

    if (!tieneMinimoLetras(formData.nombre, 2)) {
      setErrorModal('El nombre del auspiciador debe contener al menos 2 letras y no puede ser solo números.');
      return;
    }

    if (!tieneMinimoLetras(formData.rubro, 3)) {
      setErrorModal('El rubro debe contener al menos 3 letras válidas.');
      return;
    }

    if (!tieneMinimoLetras(formData.contacto, 3)) {
      setErrorModal('El nombre del contacto debe contener al menos 3 letras válidas.');
      return;
    }

    if (!/^\+?\d{7,15}$/.test(formData.telefono.trim())) {
      setErrorModal('El teléfono debe tener entre 7 y 15 dígitos numéricos (opcionalmente "+" al inicio).');
      return;
    }

    try {
      const datosLimpios = {
        ...formData,
        nombre: formData.nombre.trim(),
        rubro: formData.rubro.trim(),
        contacto: formData.contacto.trim(),
        telefono: formData.telefono.trim(),
        id_dueno: idDuenoActual
      };

      if (idEditando) {
        await modificarAuspiciador(idEditando, datosLimpios);
      } else {
        await registrarAuspiciador(datosLimpios);
        mostrarExitoTemporal('Auspiciador registrado con éxito en el sistema');
      }

      setMostrarFormulario(false);
      cancelarEdicion();
      cargarAuspiciadores();
    } catch (error) {
      setErrorModal(extraerMensajeError(error, 'Hubo un error al guardar el auspiciador.'));
    }
  };

  const abrirModalNuevoAcuerdo = () => {
    setErrorModal('');
    setFormAcuerdo({
      id_auspiciador: '',
      id_evento: '',
      tipo_aporte: 'DINERO',
      monto_comprometido: '',
      descripcion_canje: '',
      cant_menciones: '',
      fecha_comprometida: fechaHoyLocal,
      glosa: ''
    });
    setMostrarModalAcuerdo(true);
  };

  const cancelarNuevoAcuerdo = () => {
    setErrorModal('');
    setMostrarModalAcuerdo(false);
  };

  const manejarEnvioNuevoAcuerdo = async (e) => {
    e.preventDefault();
    setErrorModal('');

    const monto = Number(formAcuerdo.monto_comprometido);
    if (!Number.isInteger(monto) || monto <= 0 || monto > 500000000) {
      setErrorModal('El monto comprometido debe ser un número entero entre $1 y $500.000.000.');
      return;
    }

    if (formAcuerdo.tipo_aporte === 'CANJE' && !tieneMinimoLetras(formAcuerdo.descripcion_canje, 3)) {
      setErrorModal('La descripción del canje debe explicar el producto o servicio con palabras (no puede ser solo números).');
      return;
    }

    if (formAcuerdo.cant_menciones !== '' && (Number(formAcuerdo.cant_menciones) < 0 || Number(formAcuerdo.cant_menciones) > 50)) {
      setErrorModal('La cantidad de menciones debe estar entre 0 y 50.');
      return;
    }

    const fechaElegida = formAcuerdo.fecha_comprometida || fechaHoyLocal;
    if (fechaElegida < fechaHoyLocal) {
      setErrorModal('La fecha límite de pago debe ser desde hoy en adelante.');
      return;
    }

    if (!tieneMinimoLetras(formAcuerdo.glosa, 3)) {
      setErrorModal('La glosa debe describir el acuerdo con palabras (no se permiten solo números).');
      return;
    }

    try {
      await registrarAcuerdo({
        id_auspiciador: Number(formAcuerdo.id_auspiciador),
        id_evento: Number(formAcuerdo.id_evento),
        tipo_aporte: formAcuerdo.tipo_aporte,
        tipo_pago: formAcuerdo.tipo_aporte,
        monto_comprometido: monto,
        monto: monto,
        descripcion_canje:
          formAcuerdo.tipo_aporte === 'CANJE' ? formAcuerdo.descripcion_canje.trim() : null,
        cant_menciones: formAcuerdo.cant_menciones !== ''
          ? Number(formAcuerdo.cant_menciones)
          : null,
        fecha_comprometida: fechaElegida,
        fecha_limite: fechaElegida,
        glosa: formAcuerdo.glosa.trim(),
        id_dueno: idDuenoActual
      });

      setMostrarModalAcuerdo(false);
      cargarAcuerdos();
      mostrarExitoTemporal('Acuerdo registrado con éxito en el sistema');
    } catch (error) {
      setErrorModal(extraerMensajeError(error, 'Hubo un error al registrar el acuerdo.'));
    }
  };

  const manejarEliminar = async (id) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este auspiciador?');
    if (!confirmar) return;

    try {
      await eliminarAuspiciador(id);
      cargarAuspiciadores();
    } catch (error) {
      alert(extraerMensajeError(error, 'No se puede eliminar el auspiciador.'));
    }
  };

  const abrirModalCambio = (item) => {
    if (!esDueno) return;
    setErrorModal('');
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
    setErrorModal('');
    const { auspiciador, nuevoEstado, motivo } = modalClasificacion;
    const id = auspiciador.id_auspiciador || auspiciador.id;

    if (!tieneMinimoLetras(motivo, 3)) {
      setErrorModal('El motivo del cambio debe ser una explicación real con palabras (no solo números).');
      return;
    }

    try {
      await modificarAuspiciador(id, {
        ...auspiciador,
        clasificacion: nuevoEstado,
        motivo_clasificacion: motivo.trim()
      });

      setModalClasificacion({ abierto: false, auspiciador: null, nuevoEstado: '', motivo: '' });
      cargarAuspiciadores();
    } catch (error) {
      setErrorModal(extraerMensajeError(error, 'Error al actualizar clasificación.'));
    }
  };

  const abrirModalCumplimiento = (acuerdo) => {
    setErrorModal('');
    setModalCumplimiento({
      abierto: true,
      acuerdo,
      monto_recibido: acuerdo.monto_comprometido || '',
      fecha_recibida: fechaHoyLocal
    });
  };

  const confirmarCumplimiento = async (e) => {
    e.preventDefault();
    setErrorModal('');
    const { acuerdo, monto_recibido, fecha_recibida } = modalCumplimiento;
    const id = acuerdo.id_acuerdo || acuerdo.id;
    const valorNum = Number(monto_recibido);

    if (Number.isNaN(valorNum) || valorNum <= 0 || valorNum > 500000000) {
      setErrorModal('El monto recibido no es válido.');
      return;
    }

    if (fecha_recibida > fechaHoyLocal) {
      setErrorModal('La fecha de recepción no puede ser posterior al día de hoy.');
      return;
    }

    const teniaPagosPrevios = (acuerdo?.cumplimientos || []).length > 0;

    try {
      await registrarCumplimiento(id, {
        monto_recibido: valorNum,
        fecha_recibida,
        fecha: fecha_recibida,
        id_contador: idContadorActual
      });

      setModalCumplimiento({ abierto: false, acuerdo: null, monto_recibido: '', fecha_recibida: '' });
      cargarAcuerdos();

      if (!teniaPagosPrevios && valorNum > 0) {
        mostrarExitoTemporal('Cumplimiento de aporte registrado con éxito');
      }
    } catch (error) {
      setErrorModal(extraerMensajeError(error, 'Error al registrar cumplimiento.'));
    }
  };

  const abrirModalIncobrable = (acuerdo) => {
    setErrorModal('');
    setModalIncobrable({
      abierto: true,
      acuerdo,
      motivo: ''
    });
  };

  const confirmarIncobrable = async (e) => {
    e.preventDefault();
    setErrorModal('');
    const { acuerdo, motivo } = modalIncobrable;
    const id = acuerdo.id_acuerdo || acuerdo.id;

    if (!tieneMinimoLetras(motivo, 3)) {
      setErrorModal('Debes describir el motivo de incobrabilidad con palabras (no se permiten solo números).');
      return;
    }

    try {
      await declararIncobrable(id, motivo.trim());
      setModalIncobrable({ abierto: false, acuerdo: null, motivo: '' });
      cargarAcuerdos();
    } catch (error) {
      setErrorModal(extraerMensajeError(error, 'Error al declarar incobrable.'));
    }
  };

  const abrirModalEditarAcuerdo = (acuerdo) => {
    setErrorModal('');
    const fechaIso = acuerdo.fecha_comprometida
      ? String(acuerdo.fecha_comprometida).slice(0, 10)
      : fechaHoyLocal;

    setModalEditarAcuerdo({
      abierto: true,
      id_acuerdo: acuerdo.id_acuerdo || acuerdo.id,
      glosa: acuerdo.glosa || '',
      tipo_aporte: acuerdo.tipo_aporte || 'DINERO',
      monto_comprometido: acuerdo.monto_comprometido || '',
      descripcion_canje: acuerdo.descripcion_canje || '',
      cant_menciones: acuerdo.cant_menciones ?? '',
      fecha_comprometida: fechaIso < fechaHoyLocal ? fechaHoyLocal : fechaIso
    });
  };

  const confirmarEdicionAcuerdo = async (e) => {
    e.preventDefault();
    setErrorModal('');

    const monto = Number(modalEditarAcuerdo.monto_comprometido);
    if (!Number.isInteger(monto) || monto <= 0 || monto > 500000000) {
      setErrorModal('El monto comprometido debe ser un número entero entre $1 y $500.000.000.');
      return;
    }

    if (
      modalEditarAcuerdo.tipo_aporte === 'CANJE' &&
      !tieneMinimoLetras(modalEditarAcuerdo.descripcion_canje, 3)
    ) {
      setErrorModal('La descripción del canje debe contener palabras válidas (no solo números).');
      return;
    }

    if (
      modalEditarAcuerdo.cant_menciones !== '' &&
      (Number(modalEditarAcuerdo.cant_menciones) < 0 || Number(modalEditarAcuerdo.cant_menciones) > 50)
    ) {
      setErrorModal('La cantidad de menciones debe estar entre 0 y 50.');
      return;
    }

    if (modalEditarAcuerdo.fecha_comprometida < fechaHoyLocal) {
      setErrorModal('La fecha comprometida debe ser desde hoy en adelante.');
      return;
    }

    if (!tieneMinimoLetras(modalEditarAcuerdo.glosa, 3)) {
      setErrorModal('La glosa debe describir el compromiso con palabras (no se permiten solo números).');
      return;
    }

    try {
      await modificarAcuerdo(modalEditarAcuerdo.id_acuerdo, {
        glosa: modalEditarAcuerdo.glosa.trim(),
        tipo_aporte: modalEditarAcuerdo.tipo_aporte,
        monto_comprometido: monto,
        descripcion_canje:
          modalEditarAcuerdo.tipo_aporte === 'CANJE'
            ? modalEditarAcuerdo.descripcion_canje.trim()
            : null,
        cant_menciones:
          modalEditarAcuerdo.cant_menciones !== ''
            ? Number(modalEditarAcuerdo.cant_menciones)
            : null,
        fecha_comprometida: modalEditarAcuerdo.fecha_comprometida,
        fecha_limite: modalEditarAcuerdo.fecha_comprometida
      });

      setModalEditarAcuerdo({
        abierto: false,
        id_acuerdo: null,
        glosa: '',
        tipo_aporte: 'DINERO',
        monto_comprometido: '',
        descripcion_canje: '',
        cant_menciones: '',
        fecha_comprometida: fechaHoyLocal
      });
      cargarAcuerdos();
    } catch (error) {
      setErrorModal(extraerMensajeError(error, 'Error al modificar acuerdo.'));
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
      alert(extraerMensajeError(error, 'Error al eliminar acuerdo.'));
    }
  };

  const renderBadgeAcuerdo = (estado = 'PENDIENTE') => {
    const estadoNormalizado = estado === 'PARCIAL' ? 'CUMPLIDO' : estado;
    let claseVariante = 'ausp-badge-pendiente';
    if (estadoNormalizado === 'CUMPLIDO') claseVariante = 'ausp-badge-cumplido';
    else if (estadoNormalizado === 'VENCIDO') claseVariante = 'ausp-badge-vencido';
    else if (estadoNormalizado === 'INCOBRABLE') claseVariante = 'ausp-badge-incobrable';

    return <span className={`ausp-badge ${claseVariante}`}>{estadoNormalizado}</span>;
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

      mapaAuspiciadores[idAusp].comprometido += monto;
      totalComprometido += monto;
      mapaAuspiciadores[idAusp].totalAcuerdos += 1;

      if (acuerdo.estado === 'CUMPLIDO' || acuerdo.estado === 'PARCIAL') {
        mapaAuspiciadores[idAusp].cumplido += monto;
        totalCumplido += monto;
      } else if (acuerdo.estado === 'VENCIDO') {
        mapaAuspiciadores[idAusp].vencido += monto;
        totalVencido += monto;
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

                {esDueno && (
                  <button
                    type="button"
                    onClick={abrirModalNuevoAcuerdo}
                    className="ausp-btn-nuevo"
                  >
                    <Plus size={18} />
                    <span>Registrar acuerdo</span>
                  </button>
                )}
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

                        const rawFecha = item.fecha_comprometida || item.fecha_limite;
                        const fechaPlazo = rawFecha
                          ? String(rawFecha).slice(5, 10).split('-').reverse().join('/')
                          : '--';

                        const estado = item.estado === 'PARCIAL' ? 'CUMPLIDO' : (item.estado || 'PENDIENTE');
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
                              {esCumplido && (
                                <div className="ausp-td-recibido">
                                  Recibido: ${Number(item.monto_comprometido || 0).toLocaleString('es-CL')}
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
                                    {/* RF-P4-04: Registrar cumplimiento es exclusivo del Contador */}
                                    {esContador && !esIncobrable && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMenuAccionesAbierto(null);
                                          abrirModalCumplimiento(item);
                                        }}
                                        className="ausp-menu-item"
                                      >
                                        {esCumplido
                                          ? 'Ver / Modificar Fecha de Pago'
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

                                    {/* Acciones exclusivas del Dueño (RF-P4-02, RF-P4-06) */}
                                    {esDueno && (
                                      <>
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
                                      </>
                                    )}
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

                {esDueno && (
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
                )}
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
                            disabled={!esDueno}
                            title={
                              esDueno
                                ? 'Haz clic para cambiar la clasificación'
                                : 'Clasificación actual'
                            }
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

                        {esDueno && (
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
                        )}
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

            {errorModal && <div className="ausp-error-modal">{errorModal}</div>}

            <form onSubmit={manejarEnvio} className="ausp-form">
              <div>
                <label className="ausp-label">Nombre del Auspiciador:</label>
                <input
                  type="text"
                  name="nombre"
                  maxLength={60}
                  value={formData.nombre}
                  onChange={manejarCambio}
                  required
                  placeholder="Ej: Red Bull"
                  className="ausp-input"
                />
              </div>

              <div className="ausp-form-fila">
                <div>
                  <label className="ausp-label">Rubro (solo letras):</label>
                  <input
                    type="text"
                    name="rubro"
                    maxLength={50}
                    value={formData.rubro}
                    onChange={manejarCambio}
                    required
                    placeholder="Ej: Bebidas energéticas"
                    className="ausp-input"
                  />
                </div>

                <div>
                  <label className="ausp-label">Nombre del Contacto (solo letras):</label>
                  <input
                    type="text"
                    name="contacto"
                    maxLength={60}
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

            {errorModal && <div className="ausp-error-modal">{errorModal}</div>}

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
                    {eventosAbiertos.map((ev) => {
                      const idEv = ev.id_evento || ev.id;
                      const fechaEv = formatearFechaEvento(ev.fecha);
                      return (
                        <option key={idEv} value={idEv}>
                          {ev.tipo || ev.nombre || `Evento #${idEv}`}
                          {fechaEv ? ` (${fechaEv})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* RF-P4-03: Advertencia con historial de cumplimiento (sin parciales) */}
              {auspiciadorElegidoAcuerdo?.clasificacion === 'NO_CONFIABLE' && (
                <div className="ausp-aviso-no-confiable">
                  <AlertTriangle size={16} className="ausp-alerta-icono" />
                  <div>
                    <strong>Advertencia:</strong> Este auspiciador está clasificado como{' '}
                    <strong>No Confiable</strong>
                    {auspiciadorElegidoAcuerdo.motivo_clasificacion
                      ? ` (${auspiciadorElegidoAcuerdo.motivo_clasificacion})`
                      : ''}
                    .
                    {historialAuspiciadorElegido && (
                      <div>
                        <strong>Historial de cumplimiento:</strong> Cumplidos:{' '}
                        {historialAuspiciadorElegido.cumplidos} · Vencidos:{' '}
                        {historialAuspiciadorElegido.vencidos} · Incobrables:{' '}
                        {historialAuspiciadorElegido.incobrables}
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                    onKeyDown={bloquearNegativosTeclado}
                    required
                    min="1"
                    max="500000000"
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
                    maxLength={80}
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
                  <label className="ausp-label">Cantidad de Menciones (máx. 50):</label>
                  <input
                    type="number"
                    name="cant_menciones"
                    value={formAcuerdo.cant_menciones}
                    onChange={manejarCambioNuevoAcuerdo}
                    onKeyDown={bloquearNegativosTeclado}
                    min="0"
                    max="50"
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
                    min={fechaHoyLocal}
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
                  maxLength={80}
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
                  Registrar Acuerdo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: CUMPLIMIENTO (RF-P4-04) ================= */}
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

            {errorModal && <div className="ausp-error-modal">{errorModal}</div>}

            <form onSubmit={confirmarCumplimiento}>
              <div className="ausp-campo-grupo">
                <label className="ausp-label">
                  {modalCumplimiento.acuerdo?.tipo_aporte === 'DINERO'
                    ? 'Monto Recibido ($):'
                    : 'Valorización del Canje Recibido ($):'}
                </label>
                <input
                  type="text"
                  value={`$${Number(modalCumplimiento.monto_recibido || 0).toLocaleString('es-CL')}`}
                  readOnly
                  disabled
                  className="ausp-input"
                />
              </div>

              <div className="ausp-campo-grupo-lg">
                <label className="ausp-label">Fecha de Recepción (hoy o anterior):</label>
                <input
                  type="date"
                  lang="es-CL"
                  min="2000-01-01"
                  max={fechaHoyLocal}
                  value={modalCumplimiento.fecha_recibida}
                  onChange={(e) => {
                    setErrorModal('');
                    setModalCumplimiento({ ...modalCumplimiento, fecha_recibida: e.target.value });
                  }}
                  required
                  className="ausp-input"
                />
              </div>

              <div className="ausp-modal-pie">
                <button
                  type="button"
                  onClick={() => {
                    setErrorModal('');
                    setModalCumplimiento({
                      abierto: false,
                      acuerdo: null,
                      monto_recibido: '',
                      fecha_recibida: fechaHoyLocal
                    });
                  }}
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

      {/* ================= MODAL 2: CLASIFICACIÓN (RF-P4-07) ================= */}
      {modalClasificacion.abierto && (
        <div className="ausp-modal-fondo">
          <div className="ausp-modal-caja">
            <h3 className="ausp-modal-titulo">
              Cambiar clasificación a:{' '}
              {modalClasificacion.nuevoEstado === 'NO_CONFIABLE' ? 'No Confiable' : 'Confiable'}
            </h3>

            <p className="ausp-modal-sub">
              Auspiciador: <strong>{modalClasificacion.auspiciador?.nombre}</strong>
              {historialModalClasificacion && (
                <>
                  <br />
                  <span>
                    Acuerdos registrados — Cumplidos:{' '}
                    <strong>{historialModalClasificacion.cumplidos}</strong> · Vencidos:{' '}
                    <strong>{historialModalClasificacion.vencidos}</strong> · Incobrables:{' '}
                    <strong>{historialModalClasificacion.incobrables}</strong>
                  </span>
                </>
              )}
            </p>

            {errorModal && <div className="ausp-error-modal">{errorModal}</div>}

            <form onSubmit={confirmarCambioClasificacion}>
              <div className="ausp-campo-grupo">
                <label className="ausp-label">Motivo del cambio (requerido):</label>
                <textarea
                  maxLength={120}
                  value={modalClasificacion.motivo}
                  onChange={(e) => {
                    setErrorModal('');
                    setModalClasificacion({ ...modalClasificacion, motivo: e.target.value });
                  }}
                  placeholder="Ej: Retraso reiterado de pagos o incumplimiento de aportes..."
                  required
                  rows={3}
                  className="ausp-textarea"
                />
              </div>

              <div className="ausp-modal-pie">
                <button
                  type="button"
                  onClick={() => {
                    setErrorModal('');
                    setModalClasificacion({
                      abierto: false,
                      auspiciador: null,
                      nuevoEstado: '',
                      motivo: ''
                    });
                  }}
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

            {errorModal && <div className="ausp-error-modal">{errorModal}</div>}

            <form onSubmit={confirmarIncobrable}>
              <div className="ausp-campo-grupo">
                <label className="ausp-label">
                  Motivo por el cual se da por perdido el cobro (requerido):
                </label>
                <textarea
                  maxLength={120}
                  value={modalIncobrable.motivo}
                  onChange={(e) => {
                    setErrorModal('');
                    setModalIncobrable({ ...modalIncobrable, motivo: e.target.value });
                  }}
                  placeholder="Ej: Auspiciador no contesta correos ni llamadas..."
                  required
                  rows={3}
                  className="ausp-textarea"
                />
              </div>

              <div className="ausp-modal-pie">
                <button
                  type="button"
                  onClick={() => {
                    setErrorModal('');
                    setModalIncobrable({ abierto: false, acuerdo: null, motivo: '' });
                  }}
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

            {errorModal && <div className="ausp-error-modal">{errorModal}</div>}

            <form onSubmit={confirmarEdicionAcuerdo} className="ausp-form">
              <div>
                <label className="ausp-label">Glosa / Compromiso:</label>
                <textarea
                  maxLength={80}
                  value={modalEditarAcuerdo.glosa}
                  onChange={(e) => {
                    setErrorModal('');
                    setModalEditarAcuerdo({ ...modalEditarAcuerdo, glosa: e.target.value });
                  }}
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
                    onChange={(e) => {
                      setErrorModal('');
                      setModalEditarAcuerdo({
                        ...modalEditarAcuerdo,
                        tipo_aporte: e.target.value
                      });
                    }}
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
                    min="1"
                    max="500000000"
                    value={modalEditarAcuerdo.monto_comprometido}
                    onKeyDown={bloquearNegativosTeclado}
                    onChange={(e) => {
                      setErrorModal('');
                      setModalEditarAcuerdo({
                        ...modalEditarAcuerdo,
                        monto_comprometido: e.target.value
                      });
                    }}
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
                    maxLength={80}
                    value={modalEditarAcuerdo.descripcion_canje}
                    onChange={(e) => {
                      setErrorModal('');
                      setModalEditarAcuerdo({
                        ...modalEditarAcuerdo,
                        descripcion_canje: e.target.value
                      });
                    }}
                    required
                    placeholder="Ej: 50 poleras..."
                    className="ausp-input"
                  />
                </div>
              )}

              <div className="ausp-form-fila">
                <div>
                  <label className="ausp-label">Cant. Menciones (máx. 50):</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={modalEditarAcuerdo.cant_menciones}
                    onKeyDown={bloquearNegativosTeclado}
                    onChange={(e) => {
                      setErrorModal('');
                      setModalEditarAcuerdo({
                        ...modalEditarAcuerdo,
                        cant_menciones: e.target.value
                      });
                    }}
                    placeholder="Opcional"
                    className="ausp-input"
                  />
                </div>

                <div>
                  <label className="ausp-label">Fecha Comprometida:</label>
                  <input
                    type="date"
                    lang="es-CL"
                    min={fechaHoyLocal}
                    value={modalEditarAcuerdo.fecha_comprometida}
                    onChange={(e) => {
                      setErrorModal('');
                      setModalEditarAcuerdo({
                        ...modalEditarAcuerdo,
                        fecha_comprometida: e.target.value
                      });
                    }}
                    required
                    className="ausp-input"
                  />
                </div>
              </div>

              <div className="ausp-modal-pie">
                <button
                  type="button"
                  onClick={() => {
                    setErrorModal('');
                    setModalEditarAcuerdo({
                      abierto: false,
                      id_acuerdo: null,
                      glosa: '',
                      tipo_aporte: 'DINERO',
                      monto_comprometido: '',
                      descripcion_canje: '',
                      cant_menciones: '',
                      fecha_comprometida: fechaHoyLocal
                    });
                  }}
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