import { useEffect, useState } from 'react';
import { obtenerUsuario } from '../../services/http.js';
import { listarEventos } from '../../services/gastoEvento.service.js';
import PanelGastos from './PanelGastos.jsx';
import PanelRendiciones from './PanelRendiciones.jsx';
import PanelRemuneraciones from './PanelRemuneraciones.jsx';
import { formatearFecha } from './formato.js';

// Vista principal de finanzas



// aqui yo declaro las vistas que se pueden seleccionar, y el texto que se muestra en la pestaña
const VISTAS = [
  { id: 'gastos', texto: 'Gastos' },
  { id: 'rendiciones', texto: 'Rendiciones' },
  { id: 'remuneraciones', texto: 'Remuneraciones' },
];


export default function FinanzasEventos() {
  const usuario = obtenerUsuario() ?? {}; // obtenemos el usuario, si no vacio
  const rol = String(usuario.rol ?? '').toUpperCase(); // obtenemos el rol del usuario, si no vacio
  const esContador = rol === 'CONTADOR'; // verificamos si rol, es exactamente a "CONTADOR" y lo guardamos en una variable booleana
  const esDueno = rol === 'DUENO'; // verificamos si rol, es exactamente a "DUENO" y lo guardamos en una variable booleana

  const [eventos, setEventos] = useState([]); // guardamos los eventos realizados en un estado
  const [idEvento, setIdEvento] = useState(''); // guardamos el id del evento seleccionado en un estado
  const [vista, setVista] = useState('gastos');// guardamos la vista seleccionada en un estado
  const [error, setError] = useState('');// guardamos los errores en un estado

  useEffect(() => {
    listarEventos() // nos conectamos al server
      .then((lista) => { // guardamos los datos en la lista, que me llegan del server
        //revisa evento por evento, hasta quedarse con los realizado y cerrado
        const realizados = lista.filter((e) => ['REALIZADO', 'CERRADO'].includes(e.estado)).reverse();
        setEventos(realizados); // guardamos el array 
        if (realizados.length) setIdEvento(String(realizados[0].id_evento)); // tomamos el evento, el primer id
      })
      .catch((e) => setError(e.message)); // si algo sale mal error 
  }, []);


  const evento = eventos.find((e) => String(e.id_evento) === idEvento); // tiene que ser estrictamente id evento 
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