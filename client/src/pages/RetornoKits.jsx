import React, { useState, useEffect } from 'react';
import { obtenerKitsEnTerreno, registrarRetornoKit } from '../services/retornoKit.service.js';
import '../styles/RetornoKits.css';

const TIENE_LETRAS_REGEX = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/;

export default function RetornoKits() {
  const [salidas, setSalidas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [salidaSeleccionada, setSalidaSeleccionada] = useState(null);
  const [revisiones, setRevisiones] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [errorModal, setErrorModal] = useState('');

  const cargarSalidasEnTerreno = async () => {
    try {
      setCargando(true);
      const data = await obtenerKitsEnTerreno();
      setSalidas(data || []);
    } catch (error) {
      console.error('Error al cargar kits en terreno:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSalidasEnTerreno();
  }, []);

  const abrirModalRevision = (salida) => {
    setMensaje(null);
    setErrorModal('');
    setSalidaSeleccionada(salida);
    const estadoInicial = {};
    const equipos = salida.reserva?.kit?.equipos || [];
    equipos.forEach((eq) => {
      estadoInicial[eq.codigo] = {
        codigo: eq.codigo,
        nombre: eq.nombre,
        estado_retorno: 'OPERATIVO',
        observacion: '',
        costo_reparacion: '',
      };
    });
    setRevisiones(estadoInicial);
  };

  const cerrarModal = () => {
    setSalidaSeleccionada(null);
    setRevisiones({});
    setErrorModal('');
  };

  const handleEstadoChange = (codigo, campo, valor) => {
    if (errorModal) setErrorModal('');
    setRevisiones((prev) => ({
      ...prev,
      [codigo]: {
        ...prev[codigo],
        [campo]: valor,
      },
    }));
  };

  const handleGuardarRetorno = async (e) => {
    e.preventDefault();
    setErrorModal('');

    const listaRevisiones = Object.values(revisiones);
    for (const r of listaRevisiones) {
      const obs = (r.observacion || '').trim();
      if (obs !== '' && !TIENE_LETRAS_REGEX.test(obs)) {
        setErrorModal(
          `La observación de ${r.nombre} (${r.codigo}) debe incluir texto explicativo (no puede contener solo números o símbolos).`
        );
        return;
      }
    }

    try {
      setEnviando(true);
      const payloadRevisiones = listaRevisiones.map((r) => ({
        codigo: r.codigo,
        estado_retorno: r.estado_retorno,
        observacion: r.observacion.trim(),
        costo_reparacion: r.costo_reparacion ? Number(r.costo_reparacion) : null,
      }));

      const res = await registrarRetornoKit({
        id_salida: salidaSeleccionada.id_salida,
        revisiones: payloadRevisiones,
      });

      setMensaje({
        tipo: 'exito',
        texto: res.mensaje || 'Retorno y revisión guardados exitosamente.',
      });
      cerrarModal();
      await cargarSalidasEnTerreno();
    } catch (error) {
      cerrarModal();
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.mensaje || error.message || 'Error al guardar retorno',
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <div className="ret-cabecera">
        <h3>Kits en Terreno Pendientes de Recepción</h3>
      </div>

      {mensaje && (
        <div
          className={`ret-mensaje ${
            mensaje.tipo === 'exito' ? 'ret-mensaje-exito' : 'ret-mensaje-error'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {cargando ? (
        <div className="ret-cargando">Cargando kits en terreno...</div>
      ) : salidas.length === 0 ? (
        <div className="ret-vacio">
          No hay kits en terreno pendientes de retorno en este momento.
        </div>
      ) : (
        <div className="ret-lista">
          {salidas.map((salida) => (
            <div key={salida.id_salida} className="ret-card">
              <div>
                <strong className="ret-kit-titulo">
                  {salida.reserva?.kit?.nombre}
                </strong>
                <div className="ret-detalle-evento">
                  <strong>Evento:</strong>{' '}
                  {salida.reserva?.evento?.tipo || `#${salida.reserva?.id_evento}`}
                </div>
                <div className="ret-detalle-resp">
                  <strong>Responsable:</strong>{' '}
                  {salida.responsable?.trabajador?.nombre || 'No asignado'}
                </div>
                <div className="ret-detalle-fecha">
                  Salida: {new Date(salida.fecha_hora_salida).toLocaleString('es-CL')}
                </div>
              </div>

              <button
                type="button"
                onClick={() => abrirModalRevision(salida)}
                className="ret-btn-revisar"
              >
                Revisar Retorno
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE REVISIÓN INDIVIDUAL */}
      {salidaSeleccionada && (
        <div className="ret-modal-fondo">
          <div className="ret-modal-caja">
            <div className="ret-modal-cab">
              <div>
                <h3>Revisión Técnica: {salidaSeleccionada.reserva?.kit?.nombre}</h3>
                <span className="ret-modal-sub">
                  Inspección de estado operativo individual para el reintegro a bodega.
                </span>
              </div>
            </div>

            {errorModal && (
              <div className="ret-mensaje ret-mensaje-error" style={{ marginBottom: '0.9rem' }}>
                {errorModal}
              </div>
            )}

            <form onSubmit={handleGuardarRetorno}>
              <div className="ret-equipos-lista">
                {Object.values(revisiones).map((eq) => {
                  const noOperativo = eq.estado_retorno !== 'OPERATIVO';
                  return (
                    <div
                      key={eq.codigo}
                      className={`ret-equipo-item ${noOperativo ? 'alerta' : ''}`}
                    >
                      <div className="ret-equipo-cab">
                        <div>
                          <strong className="ret-equipo-nombre">{eq.nombre}</strong>
                          <span className="ret-equipo-codigo">({eq.codigo})</span>
                        </div>

                        <select
                          value={eq.estado_retorno}
                          onChange={(e) =>
                            handleEstadoChange(eq.codigo, 'estado_retorno', e.target.value)
                          }
                          className={`ret-select-estado ${noOperativo ? 'alerta' : ''}`}
                        >
                          <option value="OPERATIVO">Operativo</option>
                          <option value="DANO">Dañado</option>
                          <option value="PERDIDA">Perdido</option>
                          <option value="ROBO">Robado</option>
                        </select>
                      </div>

                      <div className="ret-equipo-campos">
                        <input
                          type="text"
                          maxLength={255}
                          placeholder="Observación técnica del estado o entrega..."
                          value={eq.observacion}
                          onChange={(e) =>
                            handleEstadoChange(eq.codigo, 'observacion', e.target.value)
                          }
                          className="ret-input-obs"
                        />

                        {eq.estado_retorno === 'DANO' && (
                          <div className="ret-costo-fila">
                            <span className="ret-costo-label">
                              Costo estimado reparación ($):
                            </span>
                            <input
                              type="number"
                              min="0"
                              required
                              placeholder="Ej: 45000"
                              value={eq.costo_reparacion}
                              onChange={(e) =>
                                handleEstadoChange(eq.codigo, 'costo_reparacion', e.target.value)
                              }
                              className="ret-input-costo"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="ret-modal-pie">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={enviando}
                  className="ret-btn-cancelar"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="ret-btn-confirmar"
                >
                  {enviando ? 'Guardando...' : 'Confirmar Retorno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}