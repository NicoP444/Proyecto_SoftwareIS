import { useState } from 'react';
import { Pencil, Plus, X } from 'lucide-react';
import { asignarRol, quitarRol } from '../../services/personalServicio.js';
import { rolesDe } from './ayudas.js';

/**
 * Roles del trabajador (asignar / quitar) y catálogo de roles (crear / modificar).
 */
export default function RolesTrabajador({ trabajador, roles, onCambio, onCrearRol, onEditarRol }) {
  const [rolElegido, setRolElegido] = useState('');
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);

  const asignados = rolesDe(trabajador);
  const idsAsignados = asignados.map((r) => r.id_rol);
  const sinAsignar = roles.filter((r) => !idsAsignados.includes(r.id_rol));

  // Ejecuta una llamada al back y avisa a la página para que recargue
  async function ejecutar(llamada) {
    setError('');
    setTrabajando(true);
    try {
      await llamada();
      onCambio();
    } catch (err) {
      setError(err.message);
    } finally {
      setTrabajando(false);
    }
  }

  function asignar(e) {
    e.preventDefault();
    if (!rolElegido) return;
    ejecutar(async () => {
      await asignarRol(trabajador.id_trabajador, Number(rolElegido));
      setRolElegido('');
    });
  }

  return (
    <div className="formulario">
      {error && <div className="mensaje mensaje-error">{error}</div>}

      <h4 className="subtitulo">Roles asignados</h4>
      <div className="lista-roles">
        {asignados.length === 0 && <span className="texto-tenue">Aún no tiene roles.</span>}
        {asignados.map((rol) => (
          <span key={rol.id_rol} className="chip-rol">
            {rol.nombre}
            <button
              type="button"
              className="chip-quitar"
              disabled={trabajando}
              onClick={() => ejecutar(() => quitarRol(trabajador.id_trabajador, rol.id_rol))}
              aria-label={`Quitar rol ${rol.nombre}`}
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>

      <form className="fila-asignar" onSubmit={asignar}>
        <div className="campo">
          <label htmlFor="rol-asignar">Asignar otro rol</label>
          <select id="rol-asignar" value={rolElegido} onChange={(e) => setRolElegido(e.target.value)} disabled={sinAsignar.length === 0}>
            <option value="">{sinAsignar.length === 0 ? 'No quedan roles por asignar' : 'Selecciona un rol'}</option>
            {sinAsignar.map((rol) => (
              <option key={rol.id_rol} value={rol.id_rol}>
                {rol.nombre}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="boton boton-principal" disabled={!rolElegido || trabajando}>
          Asignar
        </button>
      </form>

      <div className="fila-titulo">
        <h4 className="subtitulo">Catálogo de roles</h4>
        <button type="button" className="boton boton-texto" onClick={onCrearRol}>
          <Plus size={16} /> Crear rol
        </button>
      </div>

      <ul className="catalogo">
        {roles.map((rol) => (
          <li key={rol.id_rol}>
            <div>
              <strong>{rol.nombre}</strong>
              <span>{rol.comision != null ? `${rol.comision}% de comisión` : 'Sin comisión'}</span>
            </div>
            <button type="button" className="boton boton-texto" onClick={() => onEditarRol(rol)}>
              <Pencil size={15} /> Modificar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
