import { useEffect, useRef, useState } from "react";

// Para comparar sin importar tildes ni mayúsculas ("futbol" encuentra "Partido de fútbol")
const normalizar = (texto) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * Campo de texto libre con sugerencias (tipos de evento, direcciones ya usadas).
 * Reemplaza al <datalist> del navegador, que con Windows/Brave en modo oscuro se veía
 * negro y no se puede cambiar con CSS. Usa la misma lista blanca que el selector de cliente.
 *  - Se puede escribir cualquier texto: las sugerencias solo ayudan a no repetir con otra forma.
 *  - Flechas ↑ ↓ para moverse, Enter para elegir, Escape para cerrar la lista.
 */
export default function CampoSugerencias({ id, valor, onCambiar, sugerencias = [], ...resto }) {
  const [abierto, setAbierto] = useState(false);
  const [marcada, setMarcada] = useState(-1); // sugerencia resaltada con el teclado
  const contenedor = useRef(null);

  // Cerrar la lista al hacer clic fuera del campo
  useEffect(() => {
    if (!abierto) return;
    const alClic = (e) => {
      if (contenedor.current && !contenedor.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", alClic);
    return () => document.removeEventListener("mousedown", alClic);
  }, [abierto]);

  // Las que contienen lo escrito, sin repetir exactamente lo que ya está en el campo
  const buscado = normalizar(valor);
  const opciones = sugerencias.filter((s) => {
    const n = normalizar(s);
    return n.includes(buscado) && n !== buscado;
  });
  const mostrar = abierto && opciones.length > 0;

  function elegir(s) {
    onCambiar(s);
    setAbierto(false);
    setMarcada(-1);
  }

  function alPresionar(e) {
    if (!mostrar) {
      if (e.key === "ArrowDown") setAbierto(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMarcada((m) => Math.min(m + 1, opciones.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMarcada((m) => Math.max(m - 1, 0));
    } else if (e.key === "Enter" && marcada >= 0) {
      e.preventDefault(); // elige la sugerencia en vez de enviar el formulario
      elegir(opciones[marcada]);
    } else if (e.key === "Escape") {
      e.stopPropagation(); // cierra solo la lista, no la ventana
      setAbierto(false);
    }
  }

  return (
    <div ref={contenedor}>
      <input
        id={id}
        value={valor}
        onChange={(e) => {
          onCambiar(e.target.value);
          setAbierto(true);
          setMarcada(-1);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={alPresionar}
        autoComplete="off"
        {...resto}
      />
      {mostrar && (
        <ul className="selector-cliente-lista campo-sugerencias" role="listbox">
          {opciones.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                className={i === marcada ? "marcada" : undefined}
                onMouseDown={(e) => e.preventDefault()} // no quita el foco del campo antes del clic
                onClick={() => elegir(s)}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}