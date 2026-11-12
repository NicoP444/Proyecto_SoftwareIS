import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  listarClientes,
  crearCliente,
  modificarCliente,
  eliminarCliente,
} from "../../services/cliente.service.js";
import { formatearRut, limpiarRut, rutEsValido } from "../../utils/rut.js";

const VACIO = { rut: "", nombre: "", telefono: "", correo: "" };
const LIMITE = 50;

/**
 * RF-P1-01: registrar, modificar y eliminar clientes (solo el Dueño).
 * La lista se busca en el back por nombre o RUT.
 */
export default function GestionClientes({ onCambio }) {
  const [clientes, setClientes] = useState([]);
  const [buscar, setBuscar] = useState("");
  const [recarga, setRecarga] = useState(0); // sube cada vez que hay que volver a pedir la lista
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [formulario, setFormulario] = useState(null); // null = se ve la lista
  const [errorForm, setErrorForm] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Pide la lista 300 ms después de escribir en el buscador
  useEffect(() => {
    let vigente = true;
    const espera = setTimeout(async () => {
      try {
        const lista = await listarClientes({ buscar, limite: LIMITE });
        if (vigente) {
          setClientes(lista);
          setError("");
        }
      } catch (err) {
        if (vigente) setError(err.message);
      } finally {
        if (vigente) setCargando(false);
      }
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [buscar, recarga]);

  const cambiar = (campo) => (e) => setFormulario({ ...formulario, [campo]: e.target.value });

  function abrirNuevo() {
    setErrorForm("");
    setFormulario({ ...VACIO });
  }

  function abrirEditar(c) {
    setErrorForm("");
    setFormulario({
      id_cliente: c.id_cliente,
      rut: formatearRut(c.rut),
      nombre: c.nombre,
      telefono: c.telefono,
      correo: c.correo ?? "",
    });
  }

  async function guardar(e) {
    e.preventDefault();
    setErrorForm("");
    const f = formulario;

    if (!f.rut.trim()) return setErrorForm("El RUT es obligatorio");
    if (!rutEsValido(f.rut)) return setErrorForm("El RUT no es válido");
    if (!f.nombre.trim()) return setErrorForm("Indica el nombre del cliente");
    if (!f.telefono.trim()) return setErrorForm("Indica el teléfono del cliente");

    const datos = {
      rut: limpiarRut(f.rut),
      nombre: f.nombre.trim(),
      telefono: f.telefono.trim(),
      correo: f.correo.trim(),
    };

    setGuardando(true);
    try {
      if (f.id_cliente) await modificarCliente(f.id_cliente, datos);
      else await crearCliente(datos);
      setFormulario(null);
      setRecarga((n) => n + 1);
      onCambio?.(); // para que el calendario refresque los nombres
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(c) {
    const nEventos = c._count?.eventos ?? 0;
    if (nEventos > 0) {
      setError(
        `No se puede eliminar a ${c.nombre}: tiene ${nEventos} evento(s) asociado(s). ` +
          "Elimina o reasigna esos eventos primero."
      );
      return;
    }
    if (!window.confirm(`¿Eliminar al cliente ${c.nombre}?`)) return;
    setError("");
    try {
      await eliminarCliente(c.id_cliente);
      setRecarga((n) => n + 1);
      onCambio?.();
    } catch (err) {
      setError(err.message);
    }
  }

  // ---------- Formulario (nuevo / editar) ----------
  if (formulario) {
    return (
      <form className="formulario" onSubmit={guardar} noValidate>
        {errorForm && <div className="mensaje mensaje-error">{errorForm}</div>}

        <div className="campo">
          <label htmlFor="cli-rut">RUT</label>
          <input
            id="cli-rut"
            value={formulario.rut}
            onChange={cambiar("rut")}
            onBlur={() => setFormulario({ ...formulario, rut: formatearRut(formulario.rut) })}
            placeholder="12.345.678-5"
            maxLength={12}
            autoFocus
          />
        </div>
        <div className="campo">
          <label htmlFor="cli-nombre">Nombre</label>
          <input id="cli-nombre" value={formulario.nombre} onChange={cambiar("nombre")} maxLength={80} />
        </div>
        <div className="fila-doble">
          <div className="campo">
            <label htmlFor="cli-telefono">Teléfono</label>
            <input id="cli-telefono" value={formulario.telefono} onChange={cambiar("telefono")} placeholder="+56 9 1234 5678" maxLength={20} />
          </div>
          <div className="campo">
            <label htmlFor="cli-correo">Correo (opcional)</label>
            <input id="cli-correo" type="email" value={formulario.correo} onChange={cambiar("correo")} maxLength={120} />
          </div>
        </div>

        <div className="acciones">
          <button type="button" className="boton boton-secundario" onClick={() => setFormulario(null)}>
            Cancelar
          </button>
          <button type="submit" className="boton boton-principal" disabled={guardando}>
            {guardando ? "Guardando…" : formulario.id_cliente ? "Guardar cambios" : "Crear cliente"}
          </button>
        </div>
      </form>
    );
  }

  // ---------- Lista ----------
  return (
    <div className="cli-gestion">
      <div className="cli-barra">
        <div className="campo">
          <label htmlFor="cli-buscar">Buscar</label>
          <input
            id="cli-buscar"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Nombre o RUT"
            autoComplete="off"
          />
        </div>
        <button type="button" className="boton boton-principal" onClick={abrirNuevo}>
          <Plus size={18} /> Nuevo cliente
        </button>
      </div>

      {error && <div className="mensaje mensaje-error">{error}</div>}
      {cargando && <p className="vacio">Cargando clientes…</p>}
      {!cargando && !error && clientes.length === 0 && (
        <p className="vacio">No hay clientes que coincidan.</p>
      )}

      {clientes.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table className="cli-tabla">
            <thead>
              <tr>
                <th>RUT</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => {
                const nEventos = c._count?.eventos ?? 0;
                return (
                  <tr key={c.id_cliente}>
                    <td>{formatearRut(c.rut)}</td>
                    <td>{c.nombre}</td>
                    <td>{c.telefono}</td>
                    <td>{c.correo ?? "—"}</td>
                    <td>
                      <div className="cli-acciones">
                        <button type="button" className="boton-icono" onClick={() => abrirEditar(c)} aria-label="Modificar">
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="boton-icono"
                          onClick={() => eliminar(c)}
                          aria-disabled={nEventos > 0}
                          style={nEventos > 0 ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
                          title={nEventos > 0 ? `Tiene ${nEventos} evento(s) asociado(s)` : "Eliminar"}
                          aria-label="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {clientes.length === LIMITE && (
        <p className="texto-tenue">Mostrando los primeros {LIMITE}. Usa el buscador para encontrar a otros.</p>
      )}
    </div>
  );
}