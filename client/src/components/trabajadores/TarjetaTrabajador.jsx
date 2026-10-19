import { useEffect, useState } from 'react';
import { CalendarRange, Check, Clock } from 'lucide-react';
import { listarDisponibilidad } from '../../services/personalServicio.js';
import { DIAS, iniciales, nombreCompleto, rolesDe, textoEstado, textoPeriodo, resumenFinDeSemana } from './ayudas.js';

/** Fila L M M J V S D con los días disponibles marcados. */
export function SemanaMarcada({ disponibilidad }) {
  const diasMarcados = disponibilidad.map((d) => d.dia_semana);

  return (
    <div className="semana">
      {DIAS.map((dia) => {
        const marcado = diasMarcados.includes(dia.numero);
        return (
          <div key={dia.numero} className="semana-dia" title={dia.nombre}>
            <span>{dia.corto}</span>
            <span className={`semana-caja ${marcado ? 'marcada' : ''}`}>{marcado && <Check size={14} strokeWidth={3} />}</span>
          </div>
        );
      })}
    </div>
  );
}

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
          <span className="chip-periodo">
            <CalendarRange size={13} />
            {textoPeriodo(disponibilidad)}
          </span>
        </div>
        <SemanaMarcada disponibilidad={disponibilidad} />
        <span className="texto-pequeno">
          <Clock size={14} />
          {resumenFinDeSemana(disponibilidad)}
        </span>
      </div>
    </button>
  );
}
