import { useEffect, useState } from 'react';
import { Check, Clock, Ban, Lock } from 'lucide-react';
import Modal from '../Modal';
import { clp } from './formato';
import { revisarCierre, cerrarJornada } from '../../services/cierre.service.js';

const TITULO = { RENDICIONES_PENDIENTES: 'Rendiciones pendientes', KITS_SIN_RETORNO: 'Kits sin retorno' };

export default function PanelCierre({ idEvento, idDueno, puedeEditar, onCerrado }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    revisarCierre(idEvento)
      .then((d) => {
        setDatos(d);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [idEvento, version]);

  async function cerrar() {
    try {
      await cerrarJornada(idEvento, { id_dueno: idDueno, confirmar: true });
      setVersion((v) => v + 1);
      onCerrado();
    } catch (e) {
      setError(e.message);
    }
    setConfirmando(false);
  }

  const cerrado = datos?.estado_evento === 'CERRADO';
  const r = datos?.resultado;

  return (
    <>
      {error && <div className="fin-alerta">{error}</div>}
      {cerrado && (
        <div className="fin-alerta fin-alerta-info">
          La jornada está cerrada: remuneraciones y rentabilidad quedaron fijas.
        </div>
      )}

      {datos && (
        <section className="fin-panel">
          <div className="fin-panel-cab">
            <strong className="fin-panel-titulo">Cierre de la jornada</strong>
            {cerrado ? (
              <span className="fin-estado fin-estado-rendida">Cerrada</span>
            ) : (
              puedeEditar && (
                <button
                  type="button"
                  className="fin-btn fin-btn-primario fin-btn-chico"
                  disabled={!datos.puede_cerrar}
                  onClick={() => setConfirmando(true)}
                >
                  <Lock size={15} /> Cerrar jornada
                </button>
              )
            )}
          </div>

          <div className={`fin-check ${datos.sin_porcentaje.length === 0 ? 'fin-check-ok' : 'fin-check-bloqueo'}`}>
            {datos.sin_porcentaje.length === 0 ? <Check size={18} /> : <Ban size={18} />}
            <div>
              <strong>Porcentajes definidos</strong>
              <span>
                {datos.sin_porcentaje.length === 0
                  ? 'Todos los trabajadores tienen porcentaje'
                  : `Faltan: ${datos.sin_porcentaje.join(', ')}`}
              </span>
            </div>
          </div>

          {['RENDICIONES_PENDIENTES', 'KITS_SIN_RETORNO'].map((tipo) => {
            const aviso = datos.advertencias.find((a) => a.tipo === tipo);
            return (
              <div key={tipo} className={`fin-check ${aviso ? 'fin-check-aviso' : 'fin-check-ok'}`}>
                {aviso ? <Clock size={18} /> : <Check size={18} />}
                <div>
                  <strong>{TITULO[tipo]}</strong>
                  <span>{aviso ? aviso.detalle.join(', ') : 'Sin pendientes'}</span>
                </div>
              </div>
            );
          })}

          <div className="fin-resultado">
            <div className="fin-linea"><span>Ingresos (pagos del cliente y aportes)</span><span>{clp(r.ingresos)}</span></div>
            <div className="fin-linea"><span>Remuneraciones</span><span>− {clp(r.remuneraciones)}</span></div>
            <div className="fin-linea"><span>Gastos del evento</span><span>− {clp(r.gastos)}</span></div>
            <div className="fin-linea"><span>Pérdidas de inventario</span><span>− {clp(r.perdidas_inventario)}</span></div>
            <div className="fin-linea fin-linea-total">
              <span>Resultado ({r.tipo === 'GANANCIA' ? 'ganancia' : 'pérdida'})</span>
              <span>{clp(r.resultado)}</span>
            </div>
          </div>
        </section>
      )}

      <Modal abierto={confirmando} onCerrar={() => setConfirmando(false)} titulo="Cerrar la jornada">
        <div className="fin-form">
          <p className="fin-texto-suave">
            Las remuneraciones y la rentabilidad quedarán fijas. Los porcentajes y las asignaciones ya no podrán
            cambiarse, y los montos solo los corrige el Contador.
          </p>
          {datos?.advertencias.map((a) => (
            <div key={a.tipo} className="fin-alerta fin-alerta-info">
              <strong>{TITULO[a.tipo]}:</strong> {a.detalle.join(', ')}
            </div>
          ))}
          <div className="fin-form-pie">
            <button type="button" className="fin-btn" onClick={() => setConfirmando(false)}>Cancelar</button>
            <button type="button" className="fin-btn fin-btn-primario" onClick={cerrar}>
              {datos?.advertencias.length > 0 ? 'Cerrar de todos modos' : 'Cerrar jornada'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}