import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { listarClientes, eliminarCliente } from "../../services/cliente.service.js";
import { formatearRut } from "../../utils/rut.js";
import FormularioCliente from "./FormularioCliente";

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

  // null = se ve la lista · "nuevo" = formulario vacío · un cliente = formulario para modificarlo
  const [formulario, setFormulario] = useState(null);

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

  // Después de crear o modificar: vuelve a la lista y la refresca
  function alGuardar() {
    setFormulario(null);
    setRecarga((n) => n + 1);
    onCambio?.(); // para que el calendario refresque los nombres
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
      <FormularioCliente
        key={formulario === "nuevo" ? "nuevo" : formulario.id_cliente}
        cliente={formulario === "nuevo" ? null : formulario}
        onGuardado={alGuardar}
        onCancelar={() => setFormulario(null)}
      />
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
        <button type="button" className="boton boton-principal" onClick={() => setFormulario("nuevo")}>
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
                        <button type="button" className="boton-icono" onClick={() => setFormulario(c)} aria-label="Modificar">
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