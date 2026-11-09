import { useEffect, useState } from 'react';
import { obtenerUsuario } from '../../services/http.js';
import { listarEventos } from '../../services/gastoEvento.service.js';
import PanelGastos from './PanelGastos.jsx';
import PanelRendiciones from './PanelRendiciones.jsx';
import PanelRemuneraciones from './PanelRemuneraciones.jsx';
import { formatearFecha } from './formato.js';

// Vista principal de finanzas

const VISTAS = [
  { id: 'gastos', texto: 'Gastos' },
  { id: 'rendiciones', texto: 'Rendiciones' },
  { id: 'remuneraciones', texto: 'Remuneraciones' },
]; // definimos las vistas posibles, cada persona agrega la suya si corresponde

// Solo el Dueño define los porcentajes de remuneración, el Contador solo ve los valores calculados
export default function FinanzasEventos() {
  const usuario = obtenerUsuario() ?? {}; // obtenemos usuario en http.js, si no hay sesión devuelve null
  const rol = String(usuario.rol ?? '').toUpperCase(); // puede ser 'CONTADOR', 'DUENO', 'ADMIN', etc.
  const esContador = rol === 'CONTADOR';
  const esDueno = rol === 'DUENO';

  const [eventos, setEventos] = useState([]); // eventos realizados o cerrados, el más reciente primero
  const [idEvento, setIdEvento] = useState(''); // id del evento seleccionado, como string
  const [vista, setVista] = useState('gastos');// 'gastos', 'rendiciones' o 'remuneraciones'
  const [error, setError] = useState(''); // mensaje de error general, por ejemplo al listar eventos

  // Solo eventos ya realizados el más reciente primero
  useEffect(() => {
    listarEventos()
      .then((lista) => {
        const realizados = lista.filter((e) => ['REALIZADO', 'CERRADO'].includes(e.estado)).reverse();
        setEventos(realizados);
        if (realizados.length) setIdEvento(String(realizados[0].id_evento));
      })
      .catch((e) => setError(e.message));
  }, []);


  const evento = eventos.find((e) => String(e.id_evento) === idEvento); 
  const puedeContador = esContador && evento?.estado !== 'CERRADO';

  return (
    <>
      {error && <div className="fin-alerta">{error}</div>}
      {vista !== 'remuneraciones' && !esContador && (
        <div className="fin-alerta fin-alerta-info">Inicia sesión como Contador para registrar o modificar.</div>
      )}
      {vista === 'remuneraciones' && !esDueno && (
        <div className="fin-alerta fin-alerta-info">Solo el Dueño define los porcentajes.</div>
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
    </>
  );
}