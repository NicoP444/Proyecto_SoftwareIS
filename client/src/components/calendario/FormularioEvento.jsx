import { useState } from "react";
import SelectorCliente from "./SelectorCliente";

// "09:30" -> 570 (minutos desde medianoche)
const minutos = (hora) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Formulario para agendar un evento (RF-P1-05).
 * Repite aquí las reglas del back para avisar antes de enviar.
 * El cliente se busca por nombre o RUT; para crearlos se usa el botón "Clientes".
 */
export default function FormularioEvento({ fechaInicial = "", onGuardar, onCancelar }) {
  const [datos, setDatos] = useState({
    tipo: "",
    direccion: "",
    fecha: fechaInicial,
    hora_inicio: "",
    hora_termino: "",
    cantidad_camaras: 1,
    precio_acordado: "",
    observaciones: "",
  });
  const [cliente, setCliente] = useState(null); // cliente elegido en el buscador
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

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
    if (!cliente) return setError("Selecciona un cliente");
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
        id_cliente: cliente.id_cliente,
        cantidad_camaras: Number(datos.cantidad_camaras),
        precio_acordado: Number(datos.precio_acordado),
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
        <SelectorCliente valor={cliente} onCambiar={setCliente} />
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
  );
}