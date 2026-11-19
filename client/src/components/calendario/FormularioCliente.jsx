import { useState } from "react";
import {
  crearCliente,
  modificarCliente,
} from "../../services/cliente.service.js";
import { formatearRut, limpiarRut, rutEsValido } from "../../utils/rut.js";

const VACIO = { rut: "", nombre: "", telefono: "", correo: "" };

/**
 * Formulario para crear o modificar un cliente (RF-P1-01).
 * Lo usan la ventana "Clientes" y el buscador de clientes del formulario de evento.
 * - cliente: si viene, el formulario sirve para modificarlo.
 * - nombreInicial: precarga el nombre (ej: lo que se escribió en el buscador).
 * - onGuardado(cliente): recibe el cliente tal como lo devolvió el back.
 */
export default function FormularioCliente({
  cliente = null,
  nombreInicial = "",
  onGuardado,
  onCancelar,
}) {
  const [datos, setDatos] = useState(
    cliente
      ? {
          rut: formatearRut(cliente.rut),
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          correo: cliente.correo ?? "",
        }
      : { ...VACIO, nombre: nombreInicial },
  );
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) =>
    setDatos({ ...datos, [campo]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    e.stopPropagation(); // si está dentro del formulario de evento, que no lo envíe también
    setError("");

    if (!datos.rut.trim()) return setError("El RUT es obligatorio");
    if (!rutEsValido(datos.rut)) return setError("El RUT no es válido");
    if (!datos.nombre.trim()) return setError("Indica el nombre del cliente");
    if (!datos.telefono.trim())
      return setError("Indica el teléfono del cliente");

    const enviar = {
      rut: limpiarRut(datos.rut),
      nombre: datos.nombre.trim(),
      telefono: datos.telefono.trim(),
      correo: datos.correo.trim(),
    };

    setGuardando(true);
    try {
      const guardado = cliente
        ? await modificarCliente(cliente.id_cliente, enviar)
        : await crearCliente(enviar);
      onGuardado?.(guardado);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={guardar} noValidate>
      {error && <div className="mensaje mensaje-error">{error}</div>}

      {/* Fila 1: RUT y teléfono (campos cortos) · Fila 2: nombre y correo */}
      <div className="fila-doble">
        <div className="campo">
          <label htmlFor="cli-rut">RUT</label>
          <input
            id="cli-rut"
            value={datos.rut}
            onChange={cambiar("rut")}
            onBlur={() => setDatos({ ...datos, rut: formatearRut(datos.rut) })}
            placeholder="12.345.678-5"
            maxLength={12}
            autoFocus
          />
        </div>
        <div className="campo">
          <label htmlFor="cli-telefono">Teléfono</label>
          <input
            id="cli-telefono"
            type="tel"
            value={datos.telefono}
            onChange={cambiar("telefono")}
            placeholder="+56 9 1234 5678"
            maxLength={20}
          />
        </div>
      </div>
      <div className="fila-doble">
        <div className="campo">
          <label htmlFor="cli-nombre">Nombre</label>
          <input
            id="cli-nombre"
            value={datos.nombre}
            onChange={cambiar("nombre")}
            placeholder="Persona, colegio, club, municipalidad…"
            maxLength={80}
          />
        </div>
        <div className="campo">
          <label htmlFor="cli-correo">Correo (opcional)</label>
          <input
            id="cli-correo"
            type="email"
            value={datos.correo}
            onChange={cambiar("correo")}
            placeholder="contacto@ejemplo.cl"
            maxLength={120}
          />
        </div>
      </div>

      <div className="acciones">
        <button
          type="button"
          className="boton boton-secundario"
          onClick={onCancelar}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="boton boton-principal"
          disabled={guardando}
        >
          {guardando
            ? "Guardando…"
            : cliente
              ? "Guardar cambios"
              : "Crear cliente"}
        </button>
      </div>
    </form>
  );
}
