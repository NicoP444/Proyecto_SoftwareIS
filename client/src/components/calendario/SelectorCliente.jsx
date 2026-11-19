import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { listarClientes } from "../../services/cliente.service.js";
import { formatearRut } from "../../utils/rut.js";
import Modal from "../Modal";
import FormularioCliente from "./FormularioCliente";

/**
 * Buscador de clientes por nombre o RUT (RF-P1-01).
 * No carga todos los clientes: le pregunta al back mientras se escribe
 * y trae máximo 8, así sigue funcionando aunque haya miles de clientes.
 * Si el cliente no existe, se puede crear ahí mismo (puedeCrear) sin cerrar el formulario del evento.
 */
export default function SelectorCliente({ valor, onCambiar, puedeCrear = true }) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");
  const [creando, setCreando] = useState(false); // ventana "Nuevo cliente"
  const contenedor = useRef(null);

  // Busca 300 ms después de que el usuario deja de escribir
  useEffect(() => {
    if (!abierto) return;
    let vigente = true;
    const espera = setTimeout(async () => {
      setBuscando(true);
      try {
        const lista = await listarClientes({ buscar: texto, limite: 8 });
        if (vigente) {
          setResultados(lista);
          setError("");
        }
      } catch (err) {
        if (vigente) setError(err.message);
      } finally {
        if (vigente) setBuscando(false);
      }
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [texto, abierto]);

  // Cierra la lista al hacer clic fuera
  useEffect(() => {
    const clicFuera = (e) => {
      if (contenedor.current && !contenedor.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", clicFuera);
    return () => document.removeEventListener("mousedown", clicFuera);
  }, []);

  function elegir(cliente) {
    onCambiar(cliente);
    setTexto("");
    setAbierto(false);
  }

  function abrirCrear() {
    setAbierto(false);
    setCreando(true);
  }

  // Cliente recién creado: queda elegido de inmediato
  function alCrear(cliente) {
    setCreando(false);
    elegir(cliente);
  }

  // Enter elige el primer resultado (sin esto enviaría el formulario)
  function alPresionar(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (resultados[0]) elegir(resultados[0]);
  }

  // Si lo escrito parece un RUT no lo usamos como nombre del cliente nuevo
  const pareceRut = /^[\d.\-kK\s]+$/.test(texto.trim());

  // Ventana para crear el cliente (se dibuja encima del formulario del evento)
  const ventanaCrear = (
    <Modal abierto={creando} onCerrar={() => setCreando(false)} titulo="Nuevo cliente" cerrarConFondo={false}>
      <FormularioCliente
        nombreInicial={pareceRut ? "" : texto.trim()}
        onGuardado={alCrear}
        onCancelar={() => setCreando(false)}
      />
    </Modal>
  );

  // Ya hay un cliente elegido
  if (valor) {
    return (
      <div className="selector-cliente-elegido">
        <span>
          <strong>{valor.nombre}</strong> · {formatearRut(valor.rut)}
        </span>
        <button
          type="button"
          className="boton-icono"
          onClick={() => onCambiar(null)}
          aria-label="Cambiar cliente"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div ref={contenedor}>
      <input
        id="ev-cliente"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={alPresionar}
        placeholder="Buscar por nombre o RUT"
        autoComplete="off"
      />
      {abierto && (
        <ul className="selector-cliente-lista campo-sugerencias">
          {error && <li className="selector-cliente-vacio">{error}</li>}
          {!error && buscando && resultados.length === 0 && (
            <li className="selector-cliente-vacio">Buscando…</li>
          )}
          {!error && !buscando && resultados.length === 0 && (
            <li className="selector-cliente-vacio">No hay clientes que coincidan.</li>
          )}
          {resultados.map((c) => (
            <li key={c.id_cliente}>
              <button type="button" onClick={() => elegir(c)}>
                <span>{c.nombre}</span>
                <small>{formatearRut(c.rut)}</small>
              </button>
            </li>
          ))}
          {puedeCrear && (
            <li className="selector-cliente-crear">
              <button type="button" onClick={abrirCrear}>
                <Plus size={16} />
                {texto.trim() && !pareceRut ? `Crear cliente «${texto.trim()}»` : "Crear cliente nuevo"}
              </button>
            </li>
          )}
        </ul>
      )}
      {ventanaCrear}
    </div>
  );
}