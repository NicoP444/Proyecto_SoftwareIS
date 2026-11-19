import { useState } from 'react';
import { asignarRol } from '../../services/personalServicio.js';
import { rolesDe } from './ayudas.js';

/**
 * Roles del trabajador: solo se pueden asignar.
 */
export default function RolesTrabajador({ trabajador, roles, onCambio }) {
  const [rolElegido, setRolElegido] = useState(''); // rol elegido por el usuario
  const [error, setError] = useState(''); // mensaje de error, si lo hay
  const [trabajando, setTrabajando] = useState(false); // indica si se está asignando un rol

  const asignados = rolesDe(trabajador); // roles que ya tiene el trabajador
  const idsAsignados = asignados.map((r) => r.id_rol);
  const sinAsignar = roles.filter((r) => !idsAsignados.includes(r.id_rol)); // roles que aún no tiene

  async function asignar(e) {
    e.preventDefault();
    if (!rolElegido) return;
    setError('');
    setTrabajando(true);
    try {
      await asignarRol(trabajador.id_trabajador, Number(rolElegido));
      setRolElegido('');
      onCambio(); // avisa a la página para que recargue
    } catch (err) {
      setError(err.message);
    } finally {
      setTrabajando(false);
    }
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
    </div>
  );
}