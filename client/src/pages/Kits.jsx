import { useState, useEffect } from 'react';
import { 
  FaPlus, FaVideo, FaSlidersH, FaMicrophone, FaDesktop, 
  FaExclamationTriangle 
} from 'react-icons/fa';
import { kitClientService } from '../services/kit.service';

export default function Kits() {
  const [kits, setKits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombreKit, setNombreKit] = useState('');
  const [nivelKit, setNivelKit] = useState('BASICO');
  const [recargoPct, setRecargoPct] = useState(0);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
  const [errorKit, setErrorKit] = useState('');
  const [loadingKit, setLoadingKit] = useState(false);

  useEffect(() => {
    // Carga inicial o simulación de kits
    setKits([
      {
        id_kit: 1,
        nombre: 'Kit 1',
        nivel: 'ALTA_GAMA',
        recargo_pct: 15,
        estado: 'EN_TERRENO',
        equipos: [
          { id_equipo: 1, nombre: 'Sony FX6', categoria: 'CAMARA' },
          { id_equipo: 2, nombre: 'Manfrotto', categoria: 'TRIPODE' },
          { id_equipo: 3, nombre: 'Shure', categoria: 'MICROFONO' },
          { id_equipo: 4, nombre: 'Blackmagic', categoria: 'SWITCH_VIDEO' }
        ]
      },
      {
        id_kit: 2,
        nombre: 'Kit 2',
        nivel: 'ESTANDAR',
        recargo_pct: 0,
        estado: 'DISPONIBLE',
        equipos: [
          { id_equipo: 5, nombre: 'Sony A7S', categoria: 'CAMARA' },
          { id_equipo: 6, nombre: 'Libec', categoria: 'TRIPODE' },
          { id_equipo: 7, nombre: 'Rode', categoria: 'MICROFONO' },
          { id_equipo: 8, nombre: 'ATEM Mini', categoria: 'SWITCH_VIDEO' }
        ]
      }
    ]);
  }, []);

  const getIconoCategoria = (categoria) => {
    switch (categoria) {
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
    setLoadingKit(true);

    try {
      const payload = {
        nombre: nombreKit,
        nivel: nivelKit,
        recargo_pct: Number(recargoPct),
        equipos: equiposSeleccionados
      };

      const resultado = await kitClientService.crearKit(payload);
      alert(resultado.mensaje || 'Kit creado exitosamente');
      setIsModalOpen(false);

      setNombreKit('');
      setNivelKit('BASICO');
      setRecargoPct(0);
      setEquiposSeleccionados([]);
    } catch (err) {
      setErrorKit(err.message || 'Error al crear el kit');
    } finally {
      setLoadingKit(false);
    }
  };

  return (
    <div style={{ padding: '10px 0', width: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Cabecera con botón de crear kit */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>Gestión de Kits</h2>
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
      </div>

      {/* Listado de Kits en Tarjetas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {kits.map((kit) => (
          <div key={kit.id_kit} style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>{kit.nombre}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  {kit.nivel === 'ALTA_GAMA' ? 'Equipamiento nuevo' : 'Equipamiento estándar'} · {kit.recargo_pct > 0 ? `+${kit.recargo_pct}% sobre tarifa base` : 'Tarifa base'}
                </p>
              </div>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#334155' }}>$1.850.000</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '16px 0' }}>
              {kit.equipos.map((eq, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '8px' }}>
                  <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    {getIconoCategoria(eq.categoria)}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eq.nombre}</p>
                    <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'capitalize' }}>{eq.categoria.toLowerCase().replace('_', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {kit.estado === 'DISPONIBLE' ? (
                <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                  ● Disponible
                </span>
              ) : (
                <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                  ● Asignado — 26 ago
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CREAR KIT (RF-P5-04) */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, marginBottom: '6px', fontSize: '18px', color: '#1e293b' }}>
              Crear Nuevo Kit
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Configure el nombre, nivel, recargo y seleccione los equipos operativos requeridos.
            </p>

            {errorKit && (
              <div style={{ marginBottom: '14px', padding: '10px 14px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaExclamationTriangle />
                <span>{errorKit}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCrearKit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Nombre del Kit:</label>
                <input
                  type="text"
                  maxLength={60}
                  required
                  value={nombreKit}
                  onChange={(e) => setNombreKit(e.target.value)}
                  placeholder="Ej. Kit Audiovisual Pro"
                  style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Nivel:</label>
                  <select
                    value={nivelKit}
                    onChange={(e) => setNivelKit(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff' }}
                  >
                    <option value="BASICO">Básico</option>
                    <option value="ESTANDAR">Estándar</option>
                    <option value="ALTA_GAMA">Alta Gama</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Recargo Porcentual (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="999.99"
                    step="0.01"
                    value={recargoPct}
                    onChange={(e) => setRecargoPct(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe', fontSize: '12px', color: '#1e40af' }}>
                <p style={{ margin: '0 0 4px 0', fontWeight: '700' }}>Requisito obligatorio (RF-P5-04):</p>
                <p style={{ margin: 0 }}>Debe incluir al menos 1 <strong>cámara</strong>, 1 <strong>trípode</strong>, 1 <strong>micrófono</strong> y 1 <code>switch de video</code> operativos y sin kit asignado.</p>
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

    </div>
  );
}