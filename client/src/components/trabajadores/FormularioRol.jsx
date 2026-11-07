import { useState } from 'react';

/**
 * Formulario para crear o modificar un rol.
 * rol = null  -> crear
 * rol = {...} -> modificar
 */
// creamos la funcion formulario rol, para crear o modificar un rol, recibe como props el rol a modificar
export default function FormularioRol({ rol, onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState(rol?.nombre ?? ''); // tomamos el nombre del body o nada
  const [comision, setComision] = useState(rol?.porcentaje_referencial ?? ''); // tomamos la comision del body o nada
  const [error, setError] = useState(''); // mensaje de error para mostrar al usuario
  const [guardando, setGuardando] = useState(false); // estado de si se guardo el rol. 

  async function enviar(e) {
    e.preventDefault();//evitaamos que el formulario se envie de forma predeterminada, para poder manejarlo nosotros mismos
    if (!nombre.trim()) return setError('Ingresa el nombre del rol');//verificamos de que tenga nombre
    //verificamos de que comision este correcto
    if (comision !== '' && (comision < 0 || comision > 100)) return setError('La comisión debe estar entre 0 y 100');

    setGuardando(true);
    try { // guardamos
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
