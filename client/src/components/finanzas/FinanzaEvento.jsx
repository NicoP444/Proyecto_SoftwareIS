import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { obtenerUsuario } from '../../services/http.js';
import { listarEventos } from '../../services/gastoEvento.service.js';
import PanelGastos from './PanelGastos';
import PanelRendiciones from './PanelRendiciones';
import PanelRemuneraciones from './PanelRemuneraciones';
import PanelRentabilidad from './PanelRentabilidad';
import PanelCierre from './PanelCierre';
import { formatearFecha } from './formato';
import PanelPagos from './panelPagos.jsx';

//vista principal de finanzas, con pestañas para cada panel y buscador de evento

const VISTAS = [
  { id: 'gastos', texto: 'Gastos' },
  { id: 'rendiciones', texto: 'Rendiciones' },
  { id: 'remuneraciones', texto: 'Remuneraciones' },
  { id: 'rentabilidad', texto: 'Rentabilidad' },
  { id: 'pagos', texto: 'Pagos' },
  { id: 'cierre', texto: 'Cierre' },
];

// Texto con el que se busca y se elige un evento (el #id evita que dos se vean iguales)
const etiqueta = (ev) =>
  `#${ev.id_evento} ${ev.tipo} · ${formatearFecha(ev.fecha)}${ev.cliente?.nombre ? ` · ${ev.cliente.nombre}` : ''}`;

export default function FinanzasEventos() {
  const usuario = obtenerUsuario() ?? {};
  const rol = String(usuario.rol ?? '').toUpperCase();
  const esContador = rol === 'CONTADOR';
  const esDueno = rol === 'DUENO';

  const [eventos, setEventos] = useState([]);
  const [texto, setTexto] = useState(''); // lo que hay escrito en el buscador
  const [vista, setVista] = useState('gastos');
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0); // sube al cerrar una jornada para recargar los eventos

  // Solo eventos ya realizados (o cerrados), el más reciente primero
  useEffect(() => {
    listarEventos()
      .then((lista) => {
        const realizados = lista.filter((e) => ['REALIZADO', 'CERRADO'].includes(e.estado)).reverse();
        setEventos(realizados);
        // Al entrar queda elegido el más reciente; al recargar se mantiene lo que había
        setTexto((actual) => actual || (realizados.length ? etiqueta(realizados[0]) : ''));
      })
      .catch((e) => setError(e.message));
  }, [version]);

  // El evento elegido es el que coincide exactamente con el texto del buscador
  const evento = eventos.find((ev) => etiqueta(ev) === texto);
  const idEvento = evento ? String(evento.id_evento) : '';
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
      {(vista === 'gastos' || vista === 'rendiciones' || vista === 'pagos') && !esContador && (
        <div className="fin-alerta fin-alerta-info">Inicia sesión como Contador para registrar o modificar.</div>
      )}

      <section className="fin-filtros fin-filtros-evento">
        <div className="fin-busqueda">
          <Search size={18} />
          <input
            type="text"
            list="lista-eventos"
            placeholder="Buscar evento por tipo, cliente o fecha"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onFocus={(e) => e.target.select()} // al hacer clic se selecciona todo, para escribir encima
          />
          <datalist id="lista-eventos">
            {eventos.map((ev) => (
              <option key={ev.id_evento} value={etiqueta(ev)} />
            ))}
          </datalist>
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
      {!idEvento && (
        <p className="fin-vacio">
          {eventos.length === 0 ? 'No hay eventos realizados todavía' : 'Elige un evento de la lista para ver sus datos'}
        </p>
      )}
      {idEvento && vista === 'gastos' && (
        <PanelGastos key={idEvento} idEvento={idEvento} idContador={usuario.id} puedeEditar={puedeContador} />
      )}
      {idEvento && vista === 'rendiciones' && (
        <PanelRendiciones key={idEvento} idEvento={idEvento} idContador={usuario.id} puedeEditar={puedeContador} />
      )}
      {idEvento && vista === 'remuneraciones' && (
        <PanelRemuneraciones key={idEvento} idEvento={idEvento} idDueno={usuario.id} puedeEditar={esDueno} />
      )}
      {idEvento && vista === 'rentabilidad' && (
        <PanelRentabilidad key={idEvento} idEvento={idEvento} />
      )}
      {idEvento && vista === 'pagos' && (
        <PanelPagos key={idEvento} idEvento={idEvento} idContador={usuario.id} puedeEditar={esContador} />
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