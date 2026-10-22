import { useEffect, useState } from 'react';
import { CalendarRange, Clock } from 'lucide-react';
import { listarDisponibilidad } from '../../services/personalServicio.js';
import { iniciales, nombreCompleto, rolesDe, textoEstado, textoHorario, textoPeriodo } from './ayudas.js';

/**
 * Tarjeta de un trabajador en la lista. Al hacer clic abre su ficha.
 * "version" cambia cuando algo se guarda, para volver a pedir la disponibilidad.
 */
export default function TarjetaTrabajador({ trabajador, version, onAbrir }) {
  const [disponibilidad, setDisponibilidad] = useState([]);
  const nombre = nombreCompleto(trabajador);
  const roles = rolesDe(trabajador);

  useEffect(() => {
    listarDisponibilidad(trabajador.id_trabajador)
      .then(setDisponibilidad)
      .catch(() => setDisponibilidad([]));
  }, [trabajador.id_trabajador, version]);

  return (
    <button type="button" className={`tarjeta estado-${trabajador.estado}`} onClick={onAbrir}>
      <div className="tarjeta-cabecera">
        <span className="avatar">{iniciales(nombre)}</span>
        <div className="tarjeta-identidad">
          <div className="tarjeta-nombre">
            <strong>{nombre}</strong>
            <span className={`chip-estado ${trabajador.estado}`}>{textoEstado(trabajador.estado)}</span>
          </div>
          <div className="lista-roles">
            {roles.length > 0 ? (
              roles.map((rol) => (
                <span key={rol.id_rol} className="chip-rol">
                  {rol.nombre}
                </span>
              ))
            ) : (
              <span className="texto-tenue">Sin rol asignado</span>
            )}
          </div>
        </div>
      </div>

      <div className="tarjeta-disponibilidad">
        <div className="tarjeta-periodo">
          <span className="etiqueta">Disponibilidad</span>
          <span className="texto-tenue">
            {disponibilidad.length} {disponibilidad.length === 1 ? 'bloque' : 'bloques'}
          </span>
        </div>
        <span className="chip-periodo">
          <CalendarRange size={13} />
          {textoPeriodo(disponibilidad)}
        </span>
        <span className="texto-pequeno">
          <Clock size={14} />
          {textoHorario(disponibilidad)}
        </span>
      </div>
    </button>
  );
}