import { useState } from 'react';

/**
 * Formulario único para crear o modificar un rol.
 * El selector de arriba decide: "Crear un rol nuevo" o uno de los roles existentes.
 * rolInicial: null -> empieza en "crear"; un rol -> empieza modificándolo.
 */
export default function FormularioRol({ roles, rolInicial, onGuardar, onCancelar }) {
  const [idElegido, setIdElegido] = useState(rolInicial ? String(rolInicial.id_rol) : ''); // '' = crear un rol nuevo
  const [nombre, setNombre] = useState(rolInicial?.nombre ?? ''); // nombre del rol
  const [comision, setComision] = useState(rolInicial?.porcentaje_referencial ?? ''); // comisión del rol
  const [error, setError] = useState(''); // mensaje de error para mostrar al usuario
  const [exito, setExito] = useState(''); // mensaje de éxito
  const [guardando, setGuardando] = useState(false); // indica si se está guardando

  const rolElegido = roles.find((r) => String(r.id_rol) === idElegido) ?? null;
  const editando = Boolean(rolElegido);

  // Al cambiar el selector se cargan los datos del rol elegido, o se deja el formulario vacío
  function elegir(e) {
    const id = e.target.value;
    const rol = roles.find((r) => String(r.id_rol) === id);
    setIdElegido(id);
    setNombre(rol?.nombre ?? '');
    setComision(rol?.porcentaje_referencial ?? '');
    setError('');
    setExito('');
  }

  async function enviar(e) {
    e.preventDefault(); // evitamos que el formulario recargue la página
    setExito('');
    if (!nombre.trim()) return setError('Ingresa el nombre del rol');

    // La comisión es opcional: entre 0 y 100, con hasta dos decimales
    const valor = comision === '' ? null : Number(comision);
    if (valor !== null && (Number.isNaN(valor) || valor < 0 || valor > 100)) {
      return setError('La comisión debe estar entre 0 y 100');
    }
    if (valor !== null && Math.round(valor * 100) / 100 !== valor) {
      return setError('La comisión admite hasta dos decimales');
    }

    setError('');
    setGuardando(true);
    try {
      await onGuardar({ nombre: nombre.trim(), porcentaje_referencial: valor }, rolElegido);
      setExito(editando ? 'Rol modificado correctamente.' : 'Rol creado correctamente.');
      // Después de guardar vuelve a "crear", con el formulario limpio
      setIdElegido('');
      setNombre('');
      setComision('');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      {error && <div className="mensaje mensaje-error">{error}</div>}
      {exito && <div className="mensaje mensaje-exito">{exito}</div>}

      <div className="campo">
        <label htmlFor="rol-elegido">Rol</label>
        <select id="rol-elegido" value={idElegido} onChange={elegir} disabled={guardando}>
          <option value="">Crear un rol nuevo</option>
          {roles.map((rol) => (
            <option key={rol.id_rol} value={rol.id_rol}>
              {rol.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="campo">
        <label htmlFor="rol-nombre">Nombre del rol</label>
        <input id="rol-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Camarógrafo" autoFocus />
      </div>

      <div className="campo">
        <label htmlFor="rol-comision">Comisión (%)</label>
        <input
          id="rol-comision"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={comision}
          onChange={(e) => setComision(e.target.value)}
          placeholder="Opcional, ej: 10"
        />
      </div>

      {editando && (
        <p className="texto-tenue">
          La comisión es el porcentaje sugerido al definir la remuneración. No cambia los porcentajes ya guardados.
        </p>
      )}

      <div className="acciones" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
        <button type="button" className="boton boton-secundario" onClick={onCancelar}>
          Cerrar
        </button>
        <button type="submit" className="boton boton-principal" disabled={guardando}>
          {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear rol'}
        </button>
      </div>
    </form>
  );
}