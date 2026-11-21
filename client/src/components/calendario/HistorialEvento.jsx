import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { listarHistorialEvento } from "../../services/evento.service.js";

// Nombres legibles de los campos que se guardan en "dato" (evento #5: precio_acordado)
const CAMPOS = {
  tipo: "Tipo",
  fecha: "Fecha",
  hora_inicio: "Hora de inicio",
  hora_termino: "Hora de término",
  direccion: "Dirección",
  precio_acordado: "Precio acordado",
  id_cliente: "Cliente",
  observaciones: "Observaciones",
  estado: "Estado",
  gastos_estimados: "Gastos estimados",
  rentabilidad_final: "Rentabilidad final",
  "pago del cliente": "Pago del cliente",
  eliminado: "Evento eliminado",
  personal: "Personal",
  kit: "Kit",
};

const ESTADOS = {
  PENDIENTE_ADELANTO: "Pendiente de adelanto",
  CONFIRMADO: "Confirmado",
  REALIZADO: "Realizado",
  CERRADO: "Cerrado",
};

const TIPOS_PAGO = { ADELANTO: "Adelanto", SALDO: "Saldo", PAGO_TOTAL: "Pago total" };
const MONTOS = ["precio_acordado", "gastos_estimados", "rentabilidad_final"];
const MOTIVO_GENERICO = "Modificación del evento"; // el que pone el back si no se escribió motivo

const plata = (n) => "$" + Number(n).toLocaleString("es-CL");
const claveCampo = (dato) => String(dato).split(": ").slice(1).join(": ") || dato;
const numeroEventoDe = (dato) => String(dato).match(/evento #(\d+)/)?.[1] ?? "—";

// Muestra cada valor como se ve en el resto del sistema
function valorDe(campo, v) {
  if (v == null || v === "") return null;
  if (ESTADOS[v]) return ESTADOS[v];
  if (MONTOS.includes(campo) && /^-?\d+$/.test(v)) return plata(v);
  if (campo === "fecha" && /^\d{4}-\d{2}-\d{2}$/.test(v))
    return v.split("-").reverse().join("/");
  if (campo === "pago del cliente") {
    const [tipo, monto] = v.split(" ");
    return `${TIPOS_PAGO[tipo] ?? tipo} ${plata(monto)}`;
  }
  return v;
}

function usuarioDe(c) {
  if (c.dueno) return { nombre: c.dueno.nombre, rol: "Dueño" };
  if (c.contador) return { nombre: c.contador.nombre, rol: "Contador" };
  return { nombre: "Sistema", rol: "Automático" };
}

/** Tabla de cambios. mostrarEvento agrega la columna con el número de evento. */
export function TablaHistorial({ cambios, mostrarEvento = false }) {
  if (cambios.length === 0)
    return <p className="vacio">No hay cambios registrados.</p>;

  return (
    <div className="hist-tabla-contenedor">
      <table className="hist-tabla">
        <thead>
          <tr>
            <th>Fecha</th>
            {mostrarEvento && <th>Evento</th>}
            <th>Campo</th>
            <th>Cambio</th>
            <th>Motivo</th>
            <th>Usuario</th>
          </tr>
        </thead>
        <tbody>
          {cambios.map((c) => {
            const campo = claveCampo(c.dato);
            const antes = valorDe(campo, c.valor_anterior);
            const despues = valorDe(campo, c.valor_nuevo);
            const fecha = new Date(c.fecha_hora);
            const usuario = usuarioDe(c);
            return (
              <tr
                key={c.id_cambio}
                className={campo === "eliminado" ? "hist-fila-eliminado" : ""}
              >
                <td className="hist-fecha">
                  {fecha.toLocaleDateString("es-CL")}
                  <small>
                    {fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                  </small>
                </td>
                {mostrarEvento && (
                  <td className="hist-evento">#{numeroEventoDe(c.dato)}</td>
                )}
                <td>
                  <span className="hist-campo">{CAMPOS[campo] ?? campo}</span>
                </td>
                <td>
                  <div className="hist-cambio">
                    {antes && <span className="hist-antes">{antes}</span>}
                    {antes && despues && <ArrowRight />}
                    {despues && <span className="hist-despues">{despues}</span>}
                    {!antes && !despues && "—"}
                  </div>
                </td>
                <td
                  className={`hist-motivo ${!c.motivo || c.motivo === MOTIVO_GENERICO ? "generico" : ""}`}
                >
                  {c.motivo || "Sin motivo"}
                </td>
                <td className="hist-usuario">
                  {usuario.nombre}
                  <small>{usuario.rol}</small>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Historial de un evento: modificaciones (RF-P1-07),
 * confirmación por adelanto (RF-P1-10) y pagos. Solo lectura.
 */
export default function HistorialEvento({ idEvento, version }) {
  const [cambios, setCambios] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    listarHistorialEvento(idEvento)
      .then(setCambios)
      .catch((err) => setError(err.message));
  }, [idEvento, version]);

  if (error) return <div className="mensaje mensaje-error">{error}</div>;
  if (!cambios) return <p className="vacio">Cargando historial…</p>;
  return <TablaHistorial cambios={cambios} />;
}