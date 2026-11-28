import { pedir } from "./http.js";

export const listarEventos = () => pedir("/eventos");

export const crearEvento = (evento) =>
  pedir("/eventos", { method: "POST", body: evento });

// RF-P1-07: la respuesta trae "advertencias" (puede venir vacía)
export const modificarEvento = (id, evento) =>
  pedir(`/eventos/${id}`, { method: "PUT", body: evento });

// El back responde 204 sin cuerpo; pedir() ya lo aguanta
export const eliminarEvento = (id, motivo) =>
  pedir(`/eventos/${id}`, { method: "DELETE", body: { motivo } });

// Historial de cambios del evento (RF-P1-07, RF-P1-08, RF-P1-10)
export const listarHistorialEvento = (id) => pedir(`/eventos/${id}/historial`);

// Historial general (solo Dueño). numeroEvento es opcional
export const listarHistorialGeneral = (numeroEvento = "") =>
  pedir(
    `/eventos/historial${numeroEvento ? `?evento=${encodeURIComponent(numeroEvento)}` : ""}`,
  );