import { useEffect, useState } from 'react';
import { obtenerUsuario } from '../../services/http.js';
import { listarEventos } from '../../services/gastoEvento.service.js';
import PanelGastos from './PanelGastos';
import PanelRendiciones from './PanelRendiciones';
import PanelRemuneraciones from './PanelRemuneraciones';
import PanelCierre from './PanelCierre';
import { formatearFecha } from './formato';


//vista principal de finanzas, con pestañas para cada panel y selector de evento


const VISTAS = [
  { id: 'gastos', texto: 'Gastos' },
  { id: 'rendiciones', texto: 'Rendiciones' },
  { id: 'remuneraciones', texto: 'Remuneraciones' },
  { id: 'cierre', texto: 'Cierre' },
];

export default function FinanzasEventos() {
  const usuario = obtenerUsuario() ?? {};
  const rol = String(usuario.rol ?? '').toUpperCase();
  const esContador = rol === 'CONTADOR';
  const esDueno = rol === 'DUENO';

  const [eventos, setEventos] = useState([]);
  const [idEvento, setIdEvento] = useState('');
  const [vista, setVista] = useState('gastos');
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0); // sube al cerrar una jornada para recargar los eventos

  // Solo eventos ya realizados (o cerrados), el más reciente primero
  useEffect(() => {
    listarEventos()
      .then((lista) => {
        const realizados = lista.filter((e) => ['REALIZADO', 'CERRADO'].includes(e.estado)).reverse();
        setEventos(realizados);
        // Mantiene el evento elegido al recargar la lista
        setIdEvento((actual) => actual || (realizados.length ? String(realizados[0].id_evento) : ''));
      })
      .catch((e) => setError(e.message));
  }, [version]);

  const evento = eventos.find((e) => String(e.id_evento) === idEvento);
  const puedeContador = esContador && evento?.estado !== 'CERRADO';

  return (
    <>
      {error && <div className="fin-alerta">{error}</div>}
      {(vista === 'gastos' || vista === 'rendiciones') && !esContador && (
        <div className="fin-alerta fin-alerta-info">Inicia sesión como Contador para registrar o modificar.</div>
      )}
      {(vista === 'remuneraciones' || vista === 'cierre') && !esDueno && (
        <div className="fin-alerta fin-alerta-info">Solo el Dueño define los porcentajes y cierra la jornada.</div>
      )}

      <section className="fin-filtros fin-filtros-evento">
        <div className="fin-campo fin-filtro-evento">
          <label htmlFor="filtro-evento">Evento</label>
          <select id="filtro-evento" value={idEvento} onChange={(e) => setIdEvento(e.target.value)}>
            {eventos.length === 0 && <option value="">Sin eventos realizados</option>}
            {eventos.map((ev) => (
              <option key={ev.id_evento} value={ev.id_evento}>
                {ev.tipo} · {formatearFecha(ev.fecha)}{ev.cliente?.nombre ? ` · ${ev.cliente.nombre}` : ''}
              </option>
            ))}
          </select>
        </div>

        <nav className="fin-subtabs">
          {VISTAS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`fin-subtab ${vista === v.id ? 'activa' : ''}`}
              onClick={() => setVista(v.id)}
            >
              {v.texto}
            </button>
          ))}
        </nav>
      </section>

      {/* key: al cambiar de evento cada panel se reinicia y vuelve a cargar */}
      {!idEvento && <p className="fin-vacio">No hay eventos realizados todavía</p>}
      {idEvento && vista === 'gastos' && (
        <PanelGastos key={idEvento} idEvento={idEvento} idContador={usuario.id} puedeEditar={puedeContador} />
      )}
      {idEvento && vista === 'rendiciones' && (
        <PanelRendiciones key={idEvento} idEvento={idEvento} idContador={usuario.id} puedeEditar={puedeContador} />
      )}
      {idEvento && vista === 'remuneraciones' && (
        <PanelRemuneraciones key={idEvento} idEvento={idEvento} idDueno={usuario.id} puedeEditar={esDueno} />
      )}
      {idEvento && vista === 'cierre' && (
        <PanelCierre
          key={idEvento}
          idEvento={idEvento}
          idDueno={usuario.id}
          puedeEditar={esDueno}
          onCerrado={() => setVersion((v) => v + 1)}
        />
      )}
    </>
  );
}