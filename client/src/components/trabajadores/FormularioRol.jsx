import { useState } from 'react';

/**
 * Formulario único para crear o modificar un rol.
 * El selector de arriba decide: "Crear un rol nuevo" o uno de los roles existentes.
 * Al modificar, los campos arrancan vacíos: lo que se deja vacío no se cambia.
 * rolInicial: null -> empieza en "crear"; un rol -> empieza modificándolo.
 */
export default function FormularioRol({ roles, rolInicial, onGuardar, onCancelar }) {
  const [idElegido, setIdElegido] = useState(rolInicial ? String(rolInicial.id_rol) : ''); // '' = crear un rol nuevo
  const [nombre, setNombre] = useState(''); // siempre arranca vacío
  const [comision, setComision] = useState(''); // siempre arranca vacía
  const [error, setError] = useState(''); // mensaje de error para mostrar al usuario
  const [exito, setExito] = useState(''); // mensaje de éxito
  const [guardando, setGuardando] = useState(false); // indica si se está guardando

  const rolElegido = roles.find((r) => String(r.id_rol) === idElegido) ?? null;
  const editando = Boolean(rolElegido);

  // Al cambiar el selector, los campos quedan vacíos
  function elegir(e) {
    setIdElegido(e.target.value);
    setNombre('');
    setComision('');
    setError('');
    setExito('');
  }

  async function enviar(e) {
    e.preventDefault(); // evitamos que el formulario recargue la página
    setExito('');

    const nombreEscrito = nombre.trim();

    // Al modificar tiene que haber algo que cambiar
    if (editando && !nombreEscrito && comision === '') {
      return setError('Escribe el nombre o la comisión que quieres actualizar');
    }
    // Al crear, el nombre es obligatorio
    if (!editando && !nombreEscrito) return setError('Ingresa el nombre del rol');

    // La comisión es opcional: número entero PAR entre 0 y 20
    let valor = null; // null = sin comisión (al crear)
    if (comision !== '') {
      valor = Number(String(comision).replace(',', '.'));
      if (Number.isNaN(valor)) return setError('La comisión debe ser un número');
      if (valor < 0 || valor > 20) return setError('La comisión debe estar entre 0 y 20');
      if (!Number.isInteger(valor) || valor % 2 !== 0) {
        return setError('La comisión debe ser un número par, sin decimales (ej: 2, 4, 6...)');
      }
    } else if (editando) {
      valor = undefined; // al modificar, vacío = no cambiar la comisión (no se envía)
    }

    setError('');
    setGuardando(true);
    try {
      await onGuardar(
        {
          nombre: nombreEscrito || rolElegido.nombre, // al modificar, vacío = se conserva el nombre actual
          porcentaje_referencial: valor,
        },
        rolElegido,
      );
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
        <input
          id="rol-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={editando ? 'Actualizar nombre' : 'Ej: Camarógrafo'}
          autoFocus
        />
      </div>

      <div className="campo">
        <label htmlFor="rol-comision">Comisión (%) · número par, máximo 20</label>
        <input
          id="rol-comision"
          type="number"
          min="0"
          max="20"
          step="2"
          value={comision}
          onChange={(e) => setComision(e.target.value)}
          placeholder={editando ? 'Actualizar comisión' : 'Opcional, ej: 10'}
        />
      </div>

      <div className="acciones" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
        <button type="button" className="boton boton-secundario" onClick={onCancelar}>
          Cerrar
        </button>
        <button type="submit" className="boton boton-principal" disabled={guardando}>
          {guardando ? 'Guardando…' : editando ? 'Actualizar' : 'Crear rol'}
        </button>
      </div>
    </form>
  );
}