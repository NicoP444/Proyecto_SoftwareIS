import { pedir, obtenerUsuario } from "./http.js";

// RF-P1-09: pagos del evento con total pagado y saldo pendiente
export const listarPagosCliente = (idEvento) =>
  pedir(`/pagos-cliente/evento/${idEvento}`);

// Registra un pago; el back exige id_contador (es el id del usuario que inició sesión)
export const registrarPagoCliente = (idEvento, datos) =>
  pedir(`/pagos-cliente/evento/${idEvento}`, {
    method: "POST",
    body: { ...datos, id_contador: obtenerUsuario()?.id },
  });
