import { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "../Modal";

// "09:30" -> 570 (minutos desde medianoche)
const minutos = (hora) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Formulario para agendar un evento (RF-P1-05).
 * Repite aquí las reglas del back para avisar antes de enviar.
 * Si el cliente no existe, se puede crear sin salir de la ventana.
 */
export default function FormularioEvento({
  clientes,
  fechaInicial = "",
  onGuardar,
  onCancelar,
  onCrearCliente,
}) {
  const [datos, setDatos] = useState({
    tipo: "",
    id_cliente: "",
    direccion: "",
    fecha: fechaInicial,
    hora_inicio: "",
    hora_termino: "",
    cantidad_camaras: 1,
    precio_acordado: "",
    observaciones: "",
  });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Ventana para crear un cliente nuevo
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [cliente, setCliente] = useState({ nombre: "", telefono: "", correo: "" });
  const [errorCliente, setErrorCliente] = useState("");

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });
  const cambiarCliente = (campo) => (e) => setCliente({ ...cliente, [campo]: e.target.value });

  // Estado que tendrá el evento según su duración (5 horas o más = pendiente de adelanto)
  const horasValidas =
    datos.hora_inicio &&
    datos.hora_termino &&
    minutos(datos.hora_termino) > minutos(datos.hora_inicio);
  const duracion = horasValidas
    ? (minutos(datos.hora_termino) - minutos(datos.hora_inicio)) / 60
    : 0;

  async function enviar(e) {
    e.preventDefault();
    setError("");

    if (!datos.tipo.trim()) return setError("Indica el tipo de evento");
    if (!datos.id_cliente) return setError("Selecciona un cliente");
    if (!datos.direccion.trim()) return setError("Indica la dirección del evento");
    if (!datos.fecha) return setError("Indica la fecha");
    if (!datos.hora_inicio || !datos.hora_termino) return setError("Indica la hora de inicio y de término");
    if (!horasValidas) return setError("La hora de término debe ser posterior a la hora de inicio");
    if (!Number.isInteger(Number(datos.cantidad_camaras)) || Number(datos.cantidad_camaras) < 1)
      return setError("Debe indicar al menos 1 cámara");
    if (!Number.isInteger(Number(datos.precio_acordado)) || Number(datos.precio_acordado) <= 0)
      return setError("El precio debe ser mayor a cero");

    setGuardando(true);
    try {
      await onGuardar({
        ...datos,
        tipo: datos.tipo.trim(),
        direccion: datos.direccion.trim(),
        id_cliente: Number(datos.id_cliente),
        cantidad_camaras: Number(datos.cantidad_camaras),
        precio_acordado: Number(datos.precio_acordado),
      });
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  async function enviarCliente(e) {
    e.preventDefault();
    setErrorCliente("");
    if (!cliente.nombre.trim()) return setErrorCliente("Indica el nombre del cliente");
    if (!cliente.telefono.trim()) return setErrorCliente("Indica el teléfono del cliente");

    try {
      const nuevo = await onCrearCliente({
        nombre: cliente.nombre.trim(),
        telefono: cliente.telefono.trim(),
        correo: cliente.correo.trim(),
      });
      // Queda seleccionado en el formulario del evento
      setDatos((anterior) => ({ ...anterior, id_cliente: String(nuevo.id_cliente) }));
      setCliente({ nombre: "", telefono: "", correo: "" });
      setCreandoCliente(false);
    } catch (err) {
      setErrorCliente(err.message);
    }
  }

  return (
    <>
      <form className="formulario" onSubmit={enviar} noValidate>
        {error && <div className="mensaje mensaje-error">{error}</div>}

        <div className="campo">
          <label htmlFor="ev-tipo">Tipo de evento</label>
          <input
            id="ev-tipo"
            value={datos.tipo}
            onChange={cambiar("tipo")}
            placeholder="Partido de fútbol, licenciatura, matrimonio…"
            maxLength={40}
            autoFocus
          />
        </div>

        <div className="campo">
          <label htmlFor="ev-cliente">Cliente</label>
          <div className="cal-cliente">
            <select id="ev-cliente" value={datos.id_cliente} onChange={cambiar("id_cliente")}>
              <option value="">Selecciona un cliente</option>
              {clientes.map((c) => (
                <option key={c.id_cliente} value={c.id_cliente}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <button type="button" className="boton boton-secundario" onClick={() => setCreandoCliente(true)}>
              <Plus /> Nuevo
            </button>
          </div>
        </div>

        <div className="campo">
          <label htmlFor="ev-direccion">Dirección del evento</label>
          <input
            id="ev-direccion"
            value={datos.direccion}
            onChange={cambiar("direccion")}
            placeholder="Calle, número, comuna"
            maxLength={120}
          />
        </div>

        <div className="fila-doble">
          <div className="campo">
            <label htmlFor="ev-fecha">Fecha</label>
            <input id="ev-fecha" type="date" value={datos.fecha} onChange={cambiar("fecha")} />
          </div>
          <div className="campo">
            <label htmlFor="ev-camaras">Cantidad de cámaras</label>
            <input id="ev-camaras" type="number" min="1" value={datos.cantidad_camaras} onChange={cambiar("cantidad_camaras")} />
          </div>
        </div>

        <div className="fila-doble">
          <div className="campo">
            <label htmlFor="ev-inicio">Hora de inicio</label>
            <input id="ev-inicio" type="time" value={datos.hora_inicio} onChange={cambiar("hora_inicio")} />
          </div>
          <div className="campo">
            <label htmlFor="ev-termino">Hora de término</label>
            <input id="ev-termino" type="time" value={datos.hora_termino} onChange={cambiar("hora_termino")} />
          </div>
        </div>

        <div className="campo">
          <label htmlFor="ev-precio">Precio acordado (CLP)</label>
          <input id="ev-precio" type="number" min="1" value={datos.precio_acordado} onChange={cambiar("precio_acordado")} placeholder="Ej: 250000" />
        </div>

        <div className="campo">
          <label htmlFor="ev-obs">Observaciones (opcional)</label>
          <input id="ev-obs" value={datos.observaciones} onChange={cambiar("observaciones")} maxLength={255} />
        </div>

        {horasValidas && (
          <p className="texto-tenue">
            Dura {duracion.toLocaleString("es-CL", { maximumFractionDigits: 1 })} h: el evento quedará{" "}
            <strong>{duracion >= 5 ? "Pendiente de adelanto" : "Confirmado"}</strong>.
          </p>
        )}

        <div className="acciones">
          <button type="button" className="boton boton-secundario" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="submit" className="boton boton-principal" disabled={guardando}>
            {guardando ? "Guardando…" : "Agendar evento"}
          </button>
        </div>
      </form>

      {/* Ventana para crear un cliente sin salir del formulario */}
      <Modal abierto={creandoCliente} onCerrar={() => setCreandoCliente(false)} titulo="Nuevo cliente">
        <form className="formulario" onSubmit={enviarCliente} noValidate>
          {errorCliente && <div className="mensaje mensaje-error">{errorCliente}</div>}
          <div className="campo">
            <label htmlFor="cli-nombre">Nombre</label>
            <input id="cli-nombre" value={cliente.nombre} onChange={cambiarCliente("nombre")} maxLength={80} autoFocus />
          </div>
          <div className="campo">
            <label htmlFor="cli-telefono">Teléfono</label>
            <input id="cli-telefono" value={cliente.telefono} onChange={cambiarCliente("telefono")} placeholder="+56 9 1234 5678" maxLength={20} />
          </div>
          <div className="campo">
            <label htmlFor="cli-correo">Correo (opcional)</label>
            <input id="cli-correo" type="email" value={cliente.correo} onChange={cambiarCliente("correo")} maxLength={120} />
          </div>
          <div className="acciones">
            <button type="button" className="boton boton-secundario" onClick={() => setCreandoCliente(false)}>
              Cancelar
            </button>
            <button type="submit" className="boton boton-principal">
              Crear cliente
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}