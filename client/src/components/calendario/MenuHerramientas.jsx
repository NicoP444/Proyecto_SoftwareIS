import { useEffect, useRef, useState } from "react";
import { ChevronDown, Timer, UserCheck, Users, Wrench } from "lucide-react";

/**
 * Botón "Herramientas" del calendario: agrupa lo que no es parte del calendario
 * en sí (clientes, personal disponible y margen de traslado) en un menú desplegable.
 */
export default function MenuHerramientas({ onClientes, onPersonal, onMargen }) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);

  // Se cierra al hacer clic fuera o con Escape
  useEffect(() => {
    if (!abierto) return;
    const clicFuera = (e) => {
      if (contenedor.current && !contenedor.current.contains(e.target))
        setAbierto(false);
    };
    const tecla = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", clicFuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", clicFuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  // Cierra el menú y ejecuta la opción elegida
  const elegir = (accion) => () => {
    setAbierto(false);
    accion();
  };

  return (
    <div className="menu-herramientas" ref={contenedor}>
      <button
        type="button"
        className="boton boton-secundario"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
      >
        <Wrench size={16} /> Herramientas <ChevronDown size={16} />
      </button>

      {abierto && (
        <div className="menu-herramientas-lista" role="menu">
          <button type="button" role="menuitem" onClick={elegir(onClientes)}>
            <Users size={16} />
            <span>
              Clientes
              <small>Registrar, modificar o eliminar</small>
            </span>
          </button>
          <button type="button" role="menuitem" onClick={elegir(onPersonal)}>
            <UserCheck size={16} />
            <span>
              Personal disponible
              <small>Ver quién está libre en un horario</small>
            </span>
          </button>
          <button type="button" role="menuitem" onClick={elegir(onMargen)}>
            <Timer size={16} />
            <span>
              Margen de traslado
              <small>Tiempo mínimo entre eventos</small>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
