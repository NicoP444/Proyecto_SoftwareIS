import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Ventana emergente reutilizable (la puede usar cualquier compañero).
 * ancho: "normal" para formularios cortos, "amplio" para fichas completas.
 */
export default function Modal({ abierto, onCerrar, titulo, ancho = 'normal', children }) {
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

  return (
    <div ref={fondo} className="modal-fondo" onMouseDown={onCerrar}>
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
    </div>
  );
}
