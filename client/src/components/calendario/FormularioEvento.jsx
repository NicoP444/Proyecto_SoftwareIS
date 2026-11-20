import { useState } from "react";
import { Clock } from "lucide-react";
import SelectorCliente from "./SelectorCliente";
import SelectorHora from "./SelectorHora";
import CampoSugerencias from "./CampoSugerencias";

// "09:30" -> 570 (minutos desde medianoche)
const minutos = (hora) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

// 570 -> "09:30"
const aHora = (total) =>
  `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

// Hoy como "AAAA-MM-DD" (sin toISOString, para que no se corra el día por zona horaria)
const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// "2026-11-21" -> "Sábado 21 de noviembre de 2026" (el selector de fecha del navegador puede salir en inglés)
const fechaLegible = (iso) => {
  if (!iso) return "";
  const [a, m, d] = iso.split("-").map(Number);
  const texto = new Date(a, m - 1, d).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (texto.charAt(0).toUpperCase() + texto.slice(1)).replace(",", "");
};

// "250000" -> "250.000" (solo para mostrar; en el estado se guardan solo los dígitos)
const conPuntos = (digitos) =>
  digitos ? Number(digitos).toLocaleString("es-CL") : "";

const DURACION_SUGERIDA = 120; // al elegir la hora de inicio, el término se sugiere 2 h después
const ULTIMO_MINUTO = 23 * 60 + 55; // los eventos terminan el mismo día

/**
 * Formulario para agendar un evento (RF-P1-04) o modificarlo (RF-P1-07).
 * Repite aquí las reglas del back para avisar antes de enviar; cada error aparece bajo su campo.
 * El cliente se busca por nombre o RUT, y si no existe se puede crear desde el mismo buscador.
 * "direcciones" y "tipos" son los ya usados en otros eventos: se sugieren al escribir.
 */
export default function FormularioEvento({
  evento = null,
  fechaInicial = "",
  direcciones = [],
  tipos = [],
  onGuardar,
  onCancelar,
}) {
  const editando = Boolean(evento); // con "evento" el formulario sirve para modificarlo (RF-P1-07)
  const [datos, setDatos] = useState({
    tipo: evento?.tipo ?? "",
    direccion: evento?.direccion ?? "",
    fecha: evento ? String(evento.fecha).slice(0, 10) : fechaInicial,
    hora_inicio: evento ? String(evento.hora_inicio).slice(11, 16) : "",
    hora_termino: evento ? String(evento.hora_termino).slice(11, 16) : "",
    precio_acordado: evento ? String(evento.precio_acordado ?? "") : "", // solo dígitos
    observaciones: evento?.observaciones ?? "",
    motivo: "", // solo al modificar: por qué cambió (queda en el historial)
  });
  const [cliente, setCliente] = useState(evento?.cliente ?? null); // cliente elegido en el buscador
  const [errores, setErrores] = useState({}); // { campo: "mensaje" } de la validación del front
  const [error, setError] = useState(""); // error que devuelve el back
  const [guardando, setGuardando] = useState(false);

  // Cambia un campo y borra su error (si tenía)
  function poner(campo, valor) {
    setDatos((d) => ({ ...d, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  }
  const cambiar = (campo) => (e) => poner(campo, e.target.value);

  // Al elegir la hora de inicio, si el término está vacío o quedó antes, se sugiere +2 h
  function cambiarInicio(valor) {
    setDatos((d) => {
      const nuevo = { ...d, hora_inicio: valor };
      if (
        valor &&
        (!d.hora_termino || minutos(d.hora_termino) <= minutos(valor))
      ) {
        nuevo.hora_termino = aHora(
          Math.min(minutos(valor) + DURACION_SUGERIDA, ULTIMO_MINUTO),
        );
      }
      return nuevo;
    });
    setErrores((e) => ({
      ...e,
      hora_inicio: undefined,
      hora_termino: undefined,
    }));
  }

  // Duración y estado que tendrá el evento (5 horas o más = pendiente de adelanto)
  const horasValidas =
    datos.hora_inicio &&
    datos.hora_termino &&
    minutos(datos.hora_termino) > minutos(datos.hora_inicio);
  const duracion = horasValidas
    ? (minutos(datos.hora_termino) - minutos(datos.hora_inicio)) / 60
    : 0;
  const quedaPendiente = duracion >= 5;

  // Revisa todo y devuelve { campo: mensaje } con lo que falta o está mal
  function validar() {
    const e = {};
    const precio = Number(datos.precio_acordado);
    if (!datos.tipo.trim()) e.tipo = "Indica el tipo de evento";
    if (!cliente) e.cliente = "Selecciona o crea un cliente";
    if (!datos.direccion.trim()) e.direccion = "Indica la dirección del evento";
    if (!datos.fecha) e.fecha = "Indica la fecha";
    else if (!editando && datos.fecha < hoyLocal())
      e.fecha = "La fecha no puede ser anterior a hoy";
    if (!datos.hora_inicio) e.hora_inicio = "Indica la hora de inicio";
    if (!datos.hora_termino) e.hora_termino = "Indica la hora de término";
    else if (datos.hora_inicio && !horasValidas)
      e.hora_termino =
        "Debe ser posterior al inicio (el evento termina el mismo día)";
    if (!datos.precio_acordado || precio <= 0)
      e.precio_acordado = "Indica un precio mayor a cero";
    else if (precio > 2000000000)
      e.precio_acordado = "El precio es demasiado alto";
    if (editando && !datos.motivo.trim())
      e.motivo = "Indica el motivo del cambio (queda en el historial)";
    return e;
  }

  async function enviar(e) {
    e.preventDefault();
    setError("");

    const encontrados = validar();
    setErrores(encontrados);
    const primero = Object.keys(encontrados)[0];
    if (primero) {
      // Lleva el cursor al primer campo con error
      const ids = {
        tipo: "ev-tipo",
        cliente: "ev-cliente",
        direccion: "ev-direccion",
        fecha: "ev-fecha",
        hora_inicio: "ev-inicio",
        hora_termino: "ev-termino",
        precio_acordado: "ev-precio",
        motivo: "ev-motivo",
      };
      document.getElementById(ids[primero])?.focus();
      return;
    }

    setGuardando(true);
    try {
      await onGuardar({
        ...datos,
        tipo: datos.tipo.trim(),
        direccion: datos.direccion.trim(),
        observaciones: datos.observaciones.trim(),
        id_cliente: cliente.id_cliente,
        precio_acordado: Number(datos.precio_acordado),
      });
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  // Clase para marcar en rojo el campo que tiene error
  const conError = (campo) => (errores[campo] ? "campo con-error" : "campo");

  return (
    <form className="formulario formulario-evento" onSubmit={enviar} noValidate>
      {error && <div className="mensaje mensaje-error">{error}</div>}

      <div className={conError("tipo")}>
        <label htmlFor="ev-tipo">Tipo de evento</label>
        {/* Tipos ya usados: así no quedan "Partido de fútbol" y "partido futbol" como tipos distintos */}
        <CampoSugerencias
          id="ev-tipo"
          valor={datos.tipo}
          onCambiar={(v) => poner("tipo", v)}
          sugerencias={tipos}
          placeholder="Partido de fútbol, licenciatura, matrimonio…"
          maxLength={40}
          autoFocus
        />
        {errores.tipo && <span className="campo-error">{errores.tipo}</span>}
      </div>

      <div className={conError("cliente")}>
        <label htmlFor="ev-cliente">Cliente</label>
        <SelectorCliente
          valor={cliente}
          onCambiar={(c) => {
            setCliente(c);
            setErrores((e) => ({ ...e, cliente: undefined }));
          }}
        />
        {errores.cliente && (
          <span className="campo-error">{errores.cliente}</span>
        )}
      </div>

      <div className={conError("direccion")}>
        <label htmlFor="ev-direccion">Dirección del evento</label>
        {/* Direcciones ya usadas en otros eventos: así el mismo lugar se escribe siempre igual */}
        <CampoSugerencias
          id="ev-direccion"
          valor={datos.direccion}
          onCambiar={(v) => poner("direccion", v)}
          sugerencias={direcciones}
          placeholder="Calle, número, comuna"
          maxLength={120}
        />
        {errores.direccion && (
          <span className="campo-error">{errores.direccion}</span>
        )}
      </div>

      <div className={conError("fecha")}>
        <label htmlFor="ev-fecha">Fecha</label>
        <input
          id="ev-fecha"
          type="date"
          min={editando ? undefined : hoyLocal()}
          value={datos.fecha}
          onChange={cambiar("fecha")}
        />
        {errores.fecha ? (
          <span className="campo-error">{errores.fecha}</span>
        ) : (
          datos.fecha && (
            <span className="campo-ayuda">{fechaLegible(datos.fecha)}</span>
          )
        )}
      </div>

      <div className="fila-doble">
        <div className={conError("hora_inicio")}>
          <label htmlFor="ev-inicio">Hora de inicio (24 h)</label>
          <SelectorHora
            id="ev-inicio"
            valor={datos.hora_inicio}
            onCambiar={cambiarInicio}
          />
          {errores.hora_inicio && (
            <span className="campo-error">{errores.hora_inicio}</span>
          )}
        </div>
        <div className={conError("hora_termino")}>
          <label htmlFor="ev-termino">Hora de término (24 h)</label>
          <SelectorHora
            id="ev-termino"
            valor={datos.hora_termino}
            onCambiar={(v) => poner("hora_termino", v)}
          />
          {errores.hora_termino && (
            <span className="campo-error">{errores.hora_termino}</span>
          )}
        </div>
      </div>

      {/* Duración y estado en que quedará el evento */}
      {horasValidas &&
        (!editando ||
          ["CONFIRMADO", "PENDIENTE_ADELANTO"].includes(evento.estado)) && (
          <div
            className={`ev-duracion ${quedaPendiente ? "pendiente" : "confirmado"}`}
          >
            <Clock size={16} />
            <span>
              Dura{" "}
              {duracion.toLocaleString("es-CL", { maximumFractionDigits: 1 })} h
              · quedará{" "}
              <strong>
                {quedaPendiente ? "Pendiente de adelanto" : "Confirmado"}
              </strong>
            </span>
          </div>
        )}

      <div className={conError("precio_acordado")}>
        <label htmlFor="ev-precio">Precio acordado (CLP)</label>
        <div className="campo-con-prefijo">
          <span>$</span>
          <input
            id="ev-precio"
            inputMode="numeric"
            value={conPuntos(datos.precio_acordado)}
            onChange={(e) =>
              poner(
                "precio_acordado",
                e.target.value.replace(/\D/g, "").slice(0, 10),
              )
            }
            placeholder="250.000"
            autoComplete="off"
          />
        </div>
        {errores.precio_acordado && (
          <span className="campo-error">{errores.precio_acordado}</span>
        )}
      </div>

      <div className="campo">
        <label htmlFor="ev-obs">Observaciones (opcional)</label>
        <textarea
          id="ev-obs"
          rows={2}
          value={datos.observaciones}
          onChange={cambiar("observaciones")}
          maxLength={255}
          placeholder="Ej: Llevar cámara extra, acceso por calle lateral…"
        />
      </div>

      {editando && (
        <div className={conError("motivo")}>
          <label htmlFor="ev-motivo">Motivo del cambio</label>
          <input
            id="ev-motivo"
            value={datos.motivo}
            onChange={cambiar("motivo")}
            maxLength={255}
            placeholder="Ej: El cliente adelantó la hora de inicio"
          />
          {errores.motivo && (
            <span className="campo-error">{errores.motivo}</span>
          )}
        </div>
      )}

      {editando && (
        <p className="texto-tenue">
          Si cambias la fecha, el horario o el lugar, el sistema revisa los kits
          y el personal ya asignados.
        </p>
      )}

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
            : editando
              ? "Guardar cambios"
              : "Agendar evento"}
        </button>
      </div>
    </form>
  );
}