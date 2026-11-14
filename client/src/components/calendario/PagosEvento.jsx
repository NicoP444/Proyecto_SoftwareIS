import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  listarPagosCliente,
  registrarPagoCliente,
} from "../../services/pagoCliente.service.js";

const plata = (n) => "$" + Number(n).toLocaleString("es-CL");
const fechaCorta = (f) => String(f).slice(0, 10).split("-").reverse().join("/");
const TIPOS = {
  ADELANTO: "Adelanto",
  SALDO: "Saldo",
  PAGO_TOTAL: "Pago total",
};
const MEDIOS = ["Transferencia", "Efectivo", "Tarjeta", "Cheque", "Otro"];

// Fecha de hoy como "AAAA-MM-DD" (sin toISOString, para que no se corra el día)
function hoy() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

const FORM_VACIO = () => ({
  tipo_pago: "ADELANTO",
  monto: "",
  fecha: hoy(),
  medio_pago: "Transferencia",
});

/**
 * RF-P1-09 y RF-P1-10: pagos del cliente de un evento.
 * Dueño y Contador ven los pagos y el saldo; solo el Contador registra pagos.
 * Cuando el pago confirma el evento, avisa al calendario con onCambio.
 */
export default function PagosEvento({ idEvento, puedeRegistrar, onCambio }) {
  const [datos, setDatos] = useState(null);
  const [form, setForm] = useState(FORM_VACIO());
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    try {
      setDatos(await listarPagosCliente(idEvento));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    cargar();
  }, [idEvento]);

  const cambiar = (campo) => (ev) =>
    setForm({ ...form, [campo]: ev.target.value });

  async function registrar(ev) {
    ev.preventDefault();
    setError("");
    setAviso("");

    const monto = Number(form.monto);
    if (!Number.isInteger(monto) || monto <= 0) {
      setError("El monto debe ser un número entero mayor a cero");
      return;
    }
    if (!form.fecha) {
      setError("Indica la fecha del pago");
      return;
    }

    // Advertencia: los pagos superarían el precio (RF-P1-09)
    let confirmar = false;
    const excedente = datos.total_pagado + monto - datos.precio_acordado;
    if (excedente > 0) {
      confirmar = window.confirm(
        `Con este pago el total superaría el precio acordado en ${plata(excedente)}. ¿Registrarlo igual?`,
      );
      if (!confirmar) return;
    }

    setGuardando(true);
    try {
      const respuesta = await registrarPagoCliente(idEvento, {
        ...form,
        monto,
        confirmar,
      });
      setForm({
        ...FORM_VACIO(),
        tipo_pago: form.tipo_pago,
        medio_pago: form.medio_pago,
      });
      await cargar();
      if (respuesta.evento_confirmado) {
        setAviso(
          "El evento pasó a Confirmado: ya se recibió al menos el 50% del precio.",
        );
      }
      onCambio?.(); // el calendario refresca el estado del evento
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (!datos) {
    return error ? <div className="mensaje mensaje-error">{error}</div> : null;
  }

  const porcentaje = Math.min(
    100,
    Math.round((datos.total_pagado * 100) / datos.precio_acordado),
  );

  return (
    <div>
      <span className="etiqueta">Pagos del cliente</span>

      <dl className="viab-lista">
        <div className="viab-fila">
          <dt>Precio acordado</dt>
          <dd>{plata(datos.precio_acordado)}</dd>
        </div>
        <div className="viab-fila">
          <dt>Total pagado ({porcentaje}%)</dt>
          <dd>{plata(datos.total_pagado)}</dd>
        </div>
        <div className="viab-fila">
          <dt>Saldo pendiente</dt>
          <dd>{plata(datos.saldo_pendiente)}</dd>
        </div>
      </dl>

      <div className="pagos-barra">
        <div
          className="pagos-barra-relleno"
          style={{ width: `${porcentaje}%` }}
        />
        <span className="pagos-marca" />
      </div>
      <p className="texto-tenue">
        La marca indica el 50 % del precio, el adelanto que confirma el evento.
      </p>

      {datos.excedente > 0 && (
        <div className="mensaje mensaje-aviso">
          Los pagos superan el precio acordado en {plata(datos.excedente)}.
        </div>
      )}

      {datos.pagos.length === 0 ? (
        <p className="texto-tenue">Aún no hay pagos registrados</p>
      ) : (
        <ul className="pagos-lista">
          {datos.pagos.map((p) => (
            <li key={p.id_pago}>
              <span>
                {TIPOS[p.tipo_pago] ?? p.tipo_pago} · {p.medio_pago}
                <small>
                  {fechaCorta(p.fecha)} · registrado por {p.registrado_por}
                </small>
              </span>
              <strong>{plata(p.monto)}</strong>
            </li>
          ))}
        </ul>
      )}

      {puedeRegistrar && (
        <form className="pagos-form" onSubmit={registrar}>
          <div className="fila-doble">
            <div className="campo">
              <label htmlFor="pago-tipo">Tipo de pago</label>
              <select
                id="pago-tipo"
                value={form.tipo_pago}
                onChange={cambiar("tipo_pago")}
              >
                <option value="ADELANTO">Adelanto</option>
                <option value="SALDO">Saldo</option>
                <option value="PAGO_TOTAL">Pago total</option>
              </select>
            </div>
            <div className="campo">
              <label htmlFor="pago-monto">Monto (CLP)</label>
              <input
                id="pago-monto"
                type="number"
                min="1"
                value={form.monto}
                onChange={cambiar("monto")}
                placeholder="Ej: 100000"
              />
            </div>
          </div>
          <div className="fila-doble">
            <div className="campo">
              <label htmlFor="pago-fecha">Fecha</label>
              <input
                id="pago-fecha"
                type="date"
                value={form.fecha}
                onChange={cambiar("fecha")}
              />
            </div>
            <div className="campo">
              <label htmlFor="pago-medio">Medio de pago</label>
              <select
                id="pago-medio"
                value={form.medio_pago}
                onChange={cambiar("medio_pago")}
              >
                {MEDIOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="boton boton-principal"
            disabled={guardando}
          >
            <Plus size={16} /> {guardando ? "Registrando..." : "Registrar pago"}
          </button>
        </form>
      )}

      {aviso && <div className="mensaje mensaje-exito">{aviso}</div>}
      {error && <div className="mensaje mensaje-error">{error}</div>}
    </div>
  );
}
