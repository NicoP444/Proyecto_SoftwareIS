import { useState, useEffect } from 'react';
import {
  FaVideo,
  FaSlidersH,
  FaMicrophone,
  FaDesktop,
  FaExclamationTriangle,
  FaBoxOpen,
  FaCheckCircle
} from 'react-icons/fa';
import { kitClientService } from '../services/kit.service';
import '../styles/Kits.css';

const tieneMinimoLetras = (texto, minLetras = 2) => {
  const limpio = String(texto || '').trim();
  const coincidencias = limpio.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g) || [];
  return coincidencias.length >= minLetras;
};

const formatearEtiquetaSinGuion = (texto) => {
  if (!texto) return '';
  return String(texto).replace(/_/g, ' ');
};

export default function Kits() {
  const [kits, setKits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombreKit, setNombreKit] = useState('');
  const [nivelKit, setNivelKit] = useState('BASICO');
  const [recargoPct, setRecargoPct] = useState(0);
  const [errorKit, setErrorKit] = useState('');
  const [loadingKit, setLoadingKit] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [animacionExito, setAnimacionExito] = useState('');

  const mostrarAnimacionExito = (mensaje) => {
    setAnimacionExito(mensaje);
    setTimeout(() => {
      setAnimacionExito('');
    }, 1500);
  };

  const cargarKits = async () => {
    try {
      const data = await kitClientService.obtenerKits();
      setKits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Error al cargar kits:', error.message);
    }
  };

  useEffect(() => {
    cargarKits();
  }, []);

  const getIconoCategoria = (categoria) => {
    switch (categoria?.toUpperCase()) {
      case 'CAMARA':
        return <FaVideo className="text-blue-500" />;
      case 'TRIPODE':
        return <FaSlidersH className="text-gray-500" />;
      case 'MICROFONO':
        return <FaMicrophone className="text-indigo-500" />;
      case 'SWITCH_VIDEO':
        return <FaDesktop className="text-slate-700" />;
      default:
        return <FaVideo />;
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
      setErrorKit('El nombre del kit debe contener letras y no puede ser solo números.');
      return;
    }

    setLoadingKit(true);

    try {
      const payload = {
        nombre: nombreLimpio,
        nivel: nivelKit,
        recargo_pct: Number(recargoPct),
        equipos: []
      };

      const resultado = await kitClientService.crearKit(payload);
      setIsModalOpen(false);
      setNombreKit('');
      setNivelKit('BASICO');
      setRecargoPct(0);
      await cargarKits();
      mostrarAnimacionExito(resultado?.mensaje || 'Kit creado correctamente');
    } catch (err) {
      setErrorKit(err.message || 'Error al crear el kit');
    } finally {
      setLoadingKit(false);
    }
  };

  const handleEliminarKit = async (kit) => {
    const idKit = kit.id_kit || kit.id;
    const confirmar = window.confirm(`¿Seguro que deseas eliminar el kit "${kit.nombre}"?`);
    if (!confirmar) return;

    try {
      setEliminandoId(idKit);
      if (typeof kitClientService.eliminarKit === 'function') {
        await kitClientService.eliminarKit(idKit);
      }
      setTimeout(async () => {
        await cargarKits();
        setEliminandoId(null);
        mostrarAnimacionExito(`Kit "${kit.nombre}" eliminado correctamente`);
      }, 240);
    } catch (err) {
      setEliminandoId(null);
      alert(err.message || 'No se pudo eliminar el kit');
    }
  };

  return (
    <div className="kit-pagina">
      <div className="kit-encabezado">
        <h2 className="kit-titulo-seccion">Gestión de Kits</h2>
        <button
          type="button"
          onClick={() => {
            setErrorKit('');
            setIsModalOpen(true);
          }}
          className="kit-btn-nuevo"
        >
          <span>+</span>
          <span>Crear kit</span>
        </button>
      </div>

      {kits.length === 0 ? (
        <div
          style={{
            backgroundColor: '#f8fafc',
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
            color: '#64748b'
          }}
        >
          <FaBoxOpen style={{ fontSize: '40px', marginBottom: '12px', color: '#94a3b8' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#1e293b' }}>
            No hay kits registrados
          </h3>
          <p style={{ margin: 0, fontSize: '13px' }}>Haz clic en "+ Crear kit" para comenzar.</p>
        </div>
      ) : (
        <div className="kit-grid">
          {kits.map((kit) => {
            const idKit = kit.id_kit || kit.id;
            const estaEliminando = eliminandoId === idKit;
            return (
              <div
                key={idKit}
                className={`kit-card ${estaEliminando ? 'kit-card-eliminando' : ''}`}
              >
                <div className="kit-card-cab">
                  <div>
                    <h3 className="kit-card-titulo">{kit.nombre}</h3>
                    <p className="kit-card-sub">
                      {formatearEtiquetaSinGuion(kit.nivel)} · Recargo: {kit.recargo_pct}%
                    </p>
                  </div>
                  <div className="kit-card-acciones">
                    <button type="button" className="kit-btn-modificar">
                      Modificar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarKit(kit)}
                      className="kit-btn-eliminar"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="kit-equipos-grid">
                  {kit.equipos?.map((eq, idx) => (
                    <div key={idx} className="kit-eq-item">
                      <div className="kit-eq-icono">{getIconoCategoria(eq.categoria)}</div>
                      <div className="kit-eq-info">
                        <p className="kit-eq-nombre">{eq.nombre}</p>
                        <p className="kit-eq-cat">
                          {formatearEtiquetaSinGuion(eq.categoria)?.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="kit-card-pie">
                  {kit.estado === 'DISPONIBLE' ? (
                    <span className="kit-badge-disponible">● Disponible</span>
                  ) : kit.estado === 'INCOMPLETO' ? (
                    <span className="kit-badge-incompleto">● Incompleto</span>
                  ) : (
                    <span className="kit-badge-terreno">
                      ● {formatearEtiquetaSinGuion(kit.estado || 'EN_TERRENO')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="kit-modal-fondo">
          <div className="kit-modal-caja">
            <h2 className="kit-modal-titulo">Crear Nuevo Kit</h2>
            <p className="kit-modal-sub">
              Configure el nombre, nivel, recargo y seleccione los equipos operativos requeridos.
            </p>

            {errorKit && (
              <div className="kit-alerta-error">
                <FaExclamationTriangle />
                <span>{errorKit}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCrearKit} className="kit-form">
              <div className="kit-campo">
                <label className="kit-label">Nombre del Kit:</label>
                <input
                  type="text"
                  maxLength={50}
                  required
                  value={nombreKit}
                  onChange={(e) => setNombreKit(e.target.value)}
                  placeholder="Ej. Kit Audiovisual Pro"
                  className="kit-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="kit-campo">
                  <label className="kit-label">Nivel:</label>
                  <select
                    value={nivelKit}
                    onChange={(e) => setNivelKit(e.target.value)}
                    className="kit-select"
                  >
                    <option value="BASICO">Básico</option>
                    <option value="ESTANDAR">Estándar</option>
                    <option value="ALTA_GAMA">Alta Gama</option>
                  </select>
                </div>

                <div className="kit-campo">
                  <label className="kit-label">Recargo Porcentual (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={recargoPct}
                    onChange={(e) => setRecargoPct(e.target.value)}
                    className="kit-input"
                  />
                </div>
              </div>

              <div className="kit-info-box">
                <p style={{ margin: '0 0 4px 0', fontWeight: '700' }}>
                  Requisito obligatorio (RF-P5-04):
                </p>
                <p style={{ margin: 0 }}>
                  Debe incluir al menos 1 <strong>cámara</strong>, 1 <strong>trípode</strong>, 1{' '}
                  <strong>micrófono</strong> y 1 <code>switch de video</code> operativos.
                </p>
              </div>

              <div className="kit-modal-pie">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="kit-btn-cancelar"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={loadingKit} className="kit-btn-guardar">
                  {loadingKit ? 'Guardando...' : 'Guardar Kit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {animacionExito && (
        <div className="kit-toast-exito">
          <FaCheckCircle className="kit-toast-icono" />
          <span>{animacionExito}</span>
        </div>
      )}
    </div>
  );
}