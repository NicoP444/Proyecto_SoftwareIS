import { useState } from 'react';

/**
 * Formulario para crear o modificar un rol.
 * rol = null  -> crear
 * rol = {...} -> modificar
 */
export default function FormularioRol({ rol, onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState(rol?.nombre ?? '');
  const [comision, setComision] = useState(rol?.porcentaje_referencial ?? '');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (!nombre.trim()) return setError('Ingresa el nombre del rol');
    if (comision !== '' && (comision < 0 || comision > 100)) return setError('La comisión debe estar entre 0 y 100');

    setGuardando(true);
    try {
      await onGuardar({
        nombre: nombre.trim(),
        porcentaje_referencial: comision === '' ? null : Number(comision),
      });
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      {error && <div className="mensaje mensaje-error">{error}</div>}

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
          value={comision}
          onChange={(e) => setComision(e.target.value)}
          placeholder="Opcional, ej: 10"
        />
      </div>

      {rol && <p className="texto-tenue">El cambio se aplica a todos los trabajadores con este rol.</p>}

      <div className="acciones">
        <button type="button" className="boton boton-secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton boton-principal" disabled={guardando}>
          {guardando ? 'Guardando…' : rol ? 'Guardar cambios' : 'Crear rol'}
        </button>
      </div>
    </form>
  );
}
