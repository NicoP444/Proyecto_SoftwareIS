import { pedir } from "./http.js";

// RF-P1-06: resultado estimado del evento
export const verViabilidad = (idEvento) =>
  pedir(`/viabilidad/evento/${idEvento}`);

// El Dueño ingresa los gastos estimados y el back devuelve todo recalculado
export const guardarGastosEstimados = (idEvento, gastos_estimados) =>
  pedir(`/viabilidad/evento/${idEvento}`, {
    method: "PUT",
    body: { gastos_estimados },
  });
