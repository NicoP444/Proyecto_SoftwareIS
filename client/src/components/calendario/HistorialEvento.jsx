import { useEffect, useState } from "react";
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
  "pago del cliente": "Pago del cliente",
};

const ESTADOS = {
  PENDIENTE_ADELANTO: "Pendiente de adelanto",
  CONFIRMADO: "Confirmado",
  REALIZADO: "Realizado",
  CERRADO: "Cerrado",
};

const campoDe = (dato) => {
  const campo = String(dato).split(": ").slice(1).join(": ") || dato;
  return CAMPOS[campo] ?? campo;
};
const valorDe = (v) => (v == null || v === "" ? "—" : (ESTADOS[v] ?? v));
const fechaHora = (f) =>
  new Date(f).toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });

/**
 * Historial de cambios de un evento: modificaciones (RF-P1-07),
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
  if (!cambios) return <p className="texto-tenue">Cargando historial…</p>;
  if (cambios.length === 0)
    return <p className="texto-tenue">Este evento aún no tiene cambios registrados</p>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
        <thead>
          <tr style={{ textAlign: "left" }}>
            <th>Fecha</th>
            <th>Campo</th>
            <th>Antes</th>
            <th>Después</th>
            <th>Motivo</th>
            <th>Usuario</th>
          </tr>
        </thead>
        <tbody>
          {cambios.map((c) => (
            <tr key={c.id_cambio} style={{ borderTop: "1px solid #e5e7eb" }}>
              <td>{fechaHora(c.fecha_hora)}</td>
              <td>{campoDe(c.dato)}</td>
              <td>{valorDe(c.valor_anterior)}</td>
              <td>{valorDe(c.valor_nuevo)}</td>
              <td>{c.motivo ?? "—"}</td>
              <td>{c.dueno?.nombre ?? c.contador?.nombre ?? "Sistema"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}