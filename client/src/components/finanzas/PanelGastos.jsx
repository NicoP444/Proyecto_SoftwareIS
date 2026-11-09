import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Paperclip } from 'lucide-react';
import Modal from '../Modal';
import FormularioGasto from '../FormularioGasto';
import { TIPOS, clp, formatearFecha } from './formato';
import {
  listarGastos, listarRendiciones, crearGasto, modificarGasto, eliminarGasto, urlEvidencia,
} from '../../services/gastoEvento.service.js';

//seccion de gastos

export default function PanelGastos({ idEvento, idContador, puedeEditar }) {
  const [gastos, setGastos] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [modal, setModal] = useState(null);
  const [eliminar, setEliminar] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [errorEliminar, setErrorEliminar] = useState('');

  const recargar = () => setVersion((v) => v + 1); // obligamos a que recargue la pagina

  useEffect(() => { // trabajamos en paralelo. 
    Promise.all([listarGastos(idEvento), listarRendiciones(idEvento)])
      .then(([g, r]) => {
        setGastos(g);
        setTrabajadores(r.rendiciones);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [idEvento, version]);

  async function guardar(formData) {
    formData.append('id_contador', idContador);
    if (modal.gasto) {
      await modificarGasto(modal.gasto.id_gasto, formData);
    } else {
      formData.append('id_evento', idEvento);
      await crearGasto(formData);
    }
    setModal(null);
    recargar();
  }

  async function confirmarEliminar(e) {
    e.preventDefault();
    try {
      await eliminarGasto(eliminar.id_gasto, { id_contador: idContador, motivo });
      setEliminar(null);
      recargar();
    } catch (err) {
      setErrorEliminar(err.message);
    }
  }

  return (
    <>
      {error && <div className="fin-alerta">{error}</div>}

      <section className="fin-panel">
        <div className="fin-panel-cab">
          <strong className="fin-panel-titulo">Gastos del evento</strong>
          {puedeEditar && (
            <button type="button" className="fin-btn fin-btn-primario fin-btn-chico" onClick={() => setModal({ gasto: null })}>
              <Plus size={15} /> Registrar gasto
            </button>
          )}
        </div>

        {gastos.length === 0 ? (
          <p className="fin-vacio">No hay gastos registrados para este evento</p>
        ) : (
          <div className="fin-grid">
            {gastos.map((g) => (
              <article key={g.id_gasto} className="fin-card">
                <div className="fin-card-cab">
                  <span className="fin-avatar">{g.asignacion.trabajador.nombre.charAt(0).toUpperCase()}</span>
                  <div className="fin-card-titulo">
                    <strong>{g.asignacion.trabajador.nombre}</strong>
                    <span className="fin-sub">{TIPOS[g.tipo_gasto]}</span>
                  </div>
                  <span className="fin-monto">{clp(g.monto)}</span>
                </div>

                <div className="fin-detalle">
                  <span>{formatearFecha(g.fecha)}</span>
                  {g.tipo_gasto === 'MOVILIZACION' && <span>{g.origen} → {g.destino}</span>}
                  {g.descripcion && <span>{g.descripcion}</span>}
                </div>

                <div className="fin-card-pie">
                  <a className="fin-enlace" href={urlEvidencia(g.evidencia)} target="_blank" rel="noreferrer">
                    <Paperclip size={14} /> Evidencia
                  </a>
                  {puedeEditar && (
                    <div className="fin-acciones">
                      <button type="button" className="fin-icono-btn" aria-label="Editar gasto" onClick={() => setModal({ gasto: g })}>
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="fin-icono-btn fin-icono-peligro"
                        aria-label="Eliminar gasto"
                        onClick={() => { setMotivo(''); setErrorEliminar(''); setEliminar(g); }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal abierto={Boolean(modal)} onCerrar={() => setModal(null)} titulo={modal?.gasto ? 'Editar gasto' : 'Registrar gasto'}>
        {modal && (
          <FormularioGasto
            gasto={modal.gasto}
            trabajadores={trabajadores}
            onGuardar={guardar}
            onCancelar={() => setModal(null)}
          />
        )}
      </Modal>

      <Modal abierto={Boolean(eliminar)} onCerrar={() => setEliminar(null)} titulo="Eliminar gasto">
        {eliminar && (
          <form className="fin-form" onSubmit={confirmarEliminar}>
            {errorEliminar && <div className="fin-alerta">{errorEliminar}</div>}
            <p className="fin-texto-suave">
              Vas a eliminar el gasto de {clp(eliminar.monto)} de {eliminar.asignacion.trabajador.nombre}.
              Quedará registrado en el historial.
            </p>
            <div className="fin-campo">
              <label htmlFor="motivo-eliminar">Motivo</label>
              <input id="motivo-eliminar" required maxLength={255} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </div>
            <div className="fin-form-pie">
              <button type="button" className="fin-btn" onClick={() => setEliminar(null)}>Cancelar</button>
              <button type="submit" className="fin-btn fin-btn-peligro">Eliminar</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}