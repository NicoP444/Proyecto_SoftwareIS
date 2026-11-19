import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { obtenerUsuario } from '../../services/http.js';
import { listarEventos } from '../../services/gastoEvento.service.js';
import PanelGastos from './PanelGastos';
import PanelRendiciones from './PanelRendiciones';
import PanelRemuneraciones from './PanelRemuneraciones';
import PanelRentabilidad from './PanelRentabilidad';
import PanelPagos from './panelPagos';
import PanelCierre from './PanelCierre';
import { formatearFecha } from './formato';

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

// Para buscar sin importar mayúsculas ni tildes ("bio" encuentra "Bío")
const normalizar = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function FinanzasEventos() {
  const usuario = obtenerUsuario() ?? {};
  const rol = String(usuario.rol ?? '').toUpperCase();
  const esContador = rol === 'CONTADOR';
  const esDueno = rol === 'DUENO';

  const [eventos, setEventos] = useState([]);
  const [texto, setTexto] = useState(''); // lo que hay escrito en el buscador (vacío al entrar)
  const [abierto, setAbierto] = useState(false); // lista de sugerencias abierta o cerrada
  const [vista, setVista] = useState('gastos');
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0); // sube al cerrar una jornada para recargar los eventos

  // Solo eventos ya realizados (o cerrados), el más reciente primero
  useEffect(() => {
    listarEventos()
      .then((lista) => {
        setEventos(lista.filter((e) => ['REALIZADO', 'CERRADO'].includes(e.estado)).reverse());
      })
      .catch((e) => setError(e.message));
  }, [version]);

  // El evento elegido es el que coincide exactamente con el texto del buscador
  const evento = eventos.find((ev) => etiqueta(ev) === texto);
  const idEvento = evento ? String(evento.id_evento) : '';
  const cerrado = evento?.estado === 'CERRADO';
  const puedeContador = esContador && !cerrado;

  // Sugerencias: con un evento ya elegido se muestran todos; si no, los que coinciden con lo escrito
  const q = evento ? '' : normalizar(texto.trim());
  const sugerencias = q ? eventos.filter((ev) => normalizar(etiqueta(ev)).includes(q)) : eventos;

  function elegir(ev) {
    setTexto(etiqueta(ev));
    setAbierto(false);
  }

  // Avisos: todos los que corresponden se muestran arriba, uno debajo del otro
  const avisoCierre = !cerrado
    ? ''
    : vista === 'cierre'
      ? 'La jornada está cerrada: remuneraciones y rentabilidad quedaron fijas.'
      : vista === 'remuneraciones'
        ? 'La jornada está cerrada: los porcentajes ya no pueden cambiarse.'
        : vista === 'gastos' || vista === 'rendiciones'
          ? 'Este evento está cerrado: los gastos y las rendiciones son solo de lectura.'
          : '';

  const avisoRol =
    (vista === 'gastos' || vista === 'rendiciones' || vista === 'pagos') && !esContador
      ? 'Inicia sesión como Contador para registrar o modificar.'
      : (vista === 'remuneraciones' || vista === 'cierre') && !esDueno
        ? 'Solo el Dueño define los porcentajes y cierra la jornada.'
        : '';

  // Los pagos solo se registran con la jornada cerrada
  const avisoPagos = vista === 'pagos' && idEvento && !cerrado ? 'Los pagos se registran cuando la jornada está cerrada.' : '';

  const avisos = [avisoCierre, avisoRol, avisoPagos].filter(Boolean);

  return (
    <>
      {error && <div className="fin-alerta">{error}</div>}
      {avisos.map((a) => (
        <div key={a} className="fin-alerta fin-alerta-info">{a}</div>
      ))}

      <section className="fin-filtros fin-filtros-evento">
        <div className="fin-busqueda">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar evento por tipo, cliente o fecha"
            value={texto}
            autoComplete="off"
            role="combobox"
            aria-expanded={abierto}
            onChange={(e) => {
              setTexto(e.target.value);
              setAbierto(true);
            }}
            onFocus={(e) => {
              e.target.select(); // al hacer clic se selecciona todo, para escribir encima
              setAbierto(true);
            }}
            onBlur={() => setAbierto(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setAbierto(false);
              if (e.key === 'Enter' && !evento && sugerencias.length > 0) {
                e.preventDefault();
                elegir(sugerencias[0]); // Enter elige el primero que coincide
              }
            }}
          />

          {abierto && (
            <ul className="fin-sugerencias" role="listbox">
              {sugerencias.length === 0 ? (
                <li className="fin-sugerencia-vacia">
                  {eventos.length === 0 ? 'No hay eventos realizados todavía' : 'Ningún evento coincide'}
                </li>
              ) : (
                sugerencias.map((ev) => (
                  <li
                    key={ev.id_evento}
                    role="option"
                    aria-selected={String(ev.id_evento) === idEvento}
                    className={`fin-sugerencia ${String(ev.id_evento) === idEvento ? 'activa' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault(); // evita que el campo pierda el foco antes de elegir
                      elegir(ev);
                    }}
                  >
                    {etiqueta(ev)}
                  </li>
                ))
              )}
            </ul>
          )}
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