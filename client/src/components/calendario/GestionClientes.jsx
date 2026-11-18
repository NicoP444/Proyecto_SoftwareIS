import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { listarClientes, eliminarCliente } from "../../services/cliente.service.js";
import { formatearRut } from "../../utils/rut.js";
import FormularioCliente from "./FormularioCliente";

const LIMITE = 50;

// "+56911111111" -> "+56 9 1111 1111" (si no es un celular chileno, se muestra tal cual)
function formatearTelefono(telefono = "") {
  const digitos = telefono.replace(/\D/g, "");
  if (/^569\d{8}$/.test(digitos)) {
    return `+56 9 ${digitos.slice(3, 7)} ${digitos.slice(7)}`;
  }
  return telefono;
}

// Solo los dígitos, para los enlaces tel: y WhatsApp
const soloDigitos = (telefono = "") => telefono.replace(/\D/g, "");

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
  const [aviso, setAviso] = useState(""); // mensaje verde después de guardar o eliminar

  // null = se ve la lista · "nuevo" = formulario vacío · un cliente = formulario para modificarlo
  const [formulario, setFormulario] = useState(null);
  const [confirmando, setConfirmando] = useState(null); // id del cliente que se está por eliminar
  const [eliminando, setEliminando] = useState(false);

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
  function alGuardar(cliente) {
    setAviso(
      formulario === "nuevo"
        ? `Cliente ${cliente?.nombre ?? ""} creado`
        : `Cliente ${cliente?.nombre ?? ""} actualizado`
    );
    setFormulario(null);
    setRecarga((n) => n + 1);
    onCambio?.(); // para que el calendario refresque los nombres
  }

  function abrirFormulario(valor) {
    setAviso("");
    setError("");
    setConfirmando(null);
    setFormulario(valor);
  }

  async function eliminar(c) {
    setError("");
    setEliminando(true);
    try {
      await eliminarCliente(c.id_cliente);
      setConfirmando(null);
      setAviso(`Cliente ${c.nombre} eliminado`);
      setRecarga((n) => n + 1);
      onCambio?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setEliminando(false);
    }
  }

  // ---------- Formulario (nuevo / editar) ----------
  if (formulario) {
    return (
      <div className="cli-gestion">
        <div className="cli-form-cabecera">
          <button type="button" className="boton boton-texto" onClick={() => setFormulario(null)}>
            <ArrowLeft /> Volver a la lista
          </button>
          <h3>{formulario === "nuevo" ? "Nuevo cliente" : `Editar a ${formulario.nombre}`}</h3>
        </div>
        <FormularioCliente
          key={formulario === "nuevo" ? "nuevo" : formulario.id_cliente}
          cliente={formulario === "nuevo" ? null : formulario}
          onGuardado={alGuardar}
          onCancelar={() => setFormulario(null)}
        />
      </div>
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
        <button type="button" className="boton boton-principal" onClick={() => abrirFormulario("nuevo")}>
          <Plus size={18} /> Nuevo cliente
        </button>
      </div>

      {aviso && <div className="mensaje mensaje-exito">{aviso}</div>}
      {error && <div className="mensaje mensaje-error">{error}</div>}
      {cargando && <p className="vacio">Cargando clientes…</p>}
      {!cargando && !error && clientes.length === 0 && (
        <p className="vacio">
          {buscar ? "No hay clientes que coincidan." : "Aún no hay clientes registrados."}
        </p>
      )}

      {clientes.length > 0 && (
        <div className="cli-tabla-contenedor">
          <table className="cli-tabla">
            <thead>
              <tr>
                <th>RUT</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th className="cli-centro">Eventos</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => {
                const nEventos = c._count?.eventos ?? 0;
                const preguntando = confirmando === c.id_cliente;
                return (
                  <tr key={c.id_cliente} className={preguntando ? "cli-fila-peligro" : ""}>
                    <td className="cli-rut">{formatearRut(c.rut)}</td>
                    <td><strong>{c.nombre}</strong></td>
                    <td>
                      <div className="cli-telefono">
                        <a href={`tel:+${soloDigitos(c.telefono)}`}>{formatearTelefono(c.telefono)}</a>
                        <a
                          href={`https://wa.me/${soloDigitos(c.telefono)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="boton-icono"
                          title="Escribir por WhatsApp"
                          aria-label={`Escribir a ${c.nombre} por WhatsApp`}
                        >
                          <MessageCircle size={15} />
                        </a>
                      </div>
                    </td>
                    <td>
                      {c.correo ? <a href={`mailto:${c.correo}`}>{c.correo}</a> : <span className="texto-tenue">—</span>}
                    </td>
                    <td className="cli-centro">
                      <span className={`cli-eventos ${nEventos === 0 ? "cero" : ""}`}>{nEventos}</span>
                    </td>
                    <td>
                      {preguntando ? (
                        // Confirmación dentro de la misma fila (en vez del window.confirm del navegador)
                        <div className="cli-confirmar">
                          <span>¿Eliminar?</span>
                          <button
                            type="button"
                            className="boton boton-secundario"
                            onClick={() => setConfirmando(null)}
                            disabled={eliminando}
                          >
                            No
                          </button>
                          <button
                            type="button"
                            className="boton boton-peligro"
                            onClick={() => eliminar(c)}
                            disabled={eliminando}
                          >
                            {eliminando ? "Eliminando…" : "Sí, eliminar"}
                          </button>
                        </div>
                      ) : (
                        <div className="cli-acciones">
                          <button
                            type="button"
                            className="boton-icono"
                            onClick={() => abrirFormulario(c)}
                            title="Modificar"
                            aria-label={`Modificar a ${c.nombre}`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="boton-icono cli-eliminar"
                            onClick={() => {
                              setAviso("");
                              setConfirmando(c.id_cliente);
                            }}
                            disabled={nEventos > 0}
                            title={
                              nEventos > 0
                                ? `No se puede eliminar: tiene ${nEventos} evento(s) asociado(s)`
                                : "Eliminar"
                            }
                            aria-label={`Eliminar a ${c.nombre}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
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