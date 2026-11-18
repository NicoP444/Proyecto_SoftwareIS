import { useState, useEffect } from 'react';
import { 
  FaVideo, FaSlidersH, FaMicrophone, FaDesktop, 
  FaExclamationTriangle, FaBoxOpen 
} from 'react-icons/fa';
import { kitClientService } from '../services/kit.service';
import '../styles/Kits.css';

const tieneMinimoLetras = (texto, minLetras = 2) => {
  const limpio = String(texto || '').trim();
  const coincidencias = limpio.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g) || [];
  return coincidencias.length >= minLetras;
};

export default function Kits() {
  const [kits, setKits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombreKit, setNombreKit] = useState('');
  const [nivelKit, setNivelKit] = useState('BASICO');
  const [recargoPct, setRecargoPct] = useState(0);
  const [errorKit, setErrorKit] = useState('');
  const [loadingKit, setLoadingKit] = useState(false);

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
      case 'CAMARA': return <FaVideo className="text-blue-500" />;
      case 'TRIPODE': return <FaSlidersH className="text-gray-500" />;
      case 'MICROFONO': return <FaMicrophone className="text-indigo-500" />;
      case 'SWITCH_VIDEO': return <FaDesktop className="text-slate-700" />;
      default: return <FaVideo />;
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
      alert(resultado.mensaje || 'Kit creado exitosamente');
      setIsModalOpen(false);

      setNombreKit('');
      setNivelKit('BASICO');
      setRecargoPct(0);
      await cargarKits();
    } catch (err) {
      setErrorKit(err.message || 'Error al crear el kit');
    } finally {
      setLoadingKit(false);
    }
  };

  return (
    <div className="kit-pagina">
      
      {/* Cabecera */}
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

      {/* Listado de Kits en Tarjetas */}
      {kits.length === 0 ? (
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <FaBoxOpen style={{ fontSize: '40px', marginBottom: '12px', color: '#94a3b8' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#1e293b' }}>No hay kits registrados</h3>
          <p style={{ margin: 0, fontSize: '13px' }}>Haz clic en "+ Crear kit" para comenzar.</p>
        </div>
      ) : (
        <div className="kit-grid">
          {kits.map((kit) => (
            <div key={kit.id_kit} className="kit-card">
              <div className="kit-card-cab">
                <div>
                  <h3 className="kit-card-titulo">{kit.nombre}</h3>
                  <p className="kit-card-sub">
                    {kit.nivel} · Recargo: {kit.recargo_pct}%
                  </p>
                </div>
                <div className="kit-card-acciones">
                  <button type="button" className="kit-btn-modificar">Modificar</button>
                  <button type="button" className="kit-btn-eliminar">Eliminar</button>
                </div>
              </div>

              <div className="kit-equipos-grid">
                {kit.equipos?.map((eq, idx) => (
                  <div key={idx} className="kit-eq-item">
                    <div className="kit-eq-icono">
                      {getIconoCategoria(eq.categoria)}
                    </div>
                    <div className="kit-eq-info">
                      <p className="kit-eq-nombre">{eq.nombre}</p>
                      <p className="kit-eq-cat">{eq.categoria?.toLowerCase().replace('_', ' ')}</p>
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
                  <span className="kit-badge-terreno">● En Terreno</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR KIT */}
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
                <p style={{ margin: '0 0 4px 0', fontWeight: '700' }}>Requisito obligatorio (RF-P5-04):</p>
                <p style={{ margin: 0 }}>Debe incluir al menos 1 <strong>cámara</strong>, 1 <strong>trípode</strong>, 1 <strong>micrófono</strong> y 1 <code>switch de video</code> operativos.</p>
              </div>

              <div className="kit-modal-pie">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="kit-btn-cancelar"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingKit}
                  className="kit-btn-guardar"
                >
                  {loadingKit ? 'Guardando...' : 'Guardar Kit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}