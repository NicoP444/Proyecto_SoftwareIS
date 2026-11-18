import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Ventana emergente reutilizable (la puede usar cualquier compañero).
 * es la parte de la pantalla que aparece encima de todo lo demás, con un fondo semitransparente y un cuadro blanco con contenido.
 * Se dibuja directo en <body> (portal), así se puede abrir una ventana encima de otra sin problemas.
 * cerrarConFondo = false: hacer clic en el fondo oscuro NO cierra la ventana (úsalo en formularios para no perder lo escrito).
 */
export default function Modal({ abierto, onCerrar, titulo, ancho = 'normal', cerrarConFondo = true, children }) {
  const fondo = useRef(null);

  // Cerrar con la tecla Escape (solo la ventana de más arriba, si hay dos abiertas)
  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e) => {
      const ventanas = document.querySelectorAll('.modal-fondo');
      if (e.key === 'Escape' && ventanas[ventanas.length - 1] === fondo.current) onCerrar();
    };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return createPortal(
    <div
      ref={fondo}
      className="modal-fondo"
      onMouseDown={(e) => {
        e.stopPropagation(); // que el clic no llegue a la ventana de abajo (si hay una)
        if (cerrarConFondo) onCerrar();
      }}
    >
      <div
        className={`modal modal-${ancho}`}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-cabecera">
          <h2>{titulo}</h2>
          <button type="button" className="boton-icono" onClick={onCerrar} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="modal-contenido">{children}</div>
      </div>
    </div>,
    document.body
  );
}