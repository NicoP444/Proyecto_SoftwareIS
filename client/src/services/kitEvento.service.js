import { pedir, obtenerUsuario } from "./http.js";

// El back (validarDueno) pide id_dueno: es el id del usuario que inició sesión
const idDueno = () => obtenerUsuario()?.id;

// Kits que ya tiene el evento
export const listarKitsEvento = (idEvento) =>
  pedir(`/eventos/${idEvento}/kits`);

// RF-P1-05: kits completos y libres en el horario del evento
export const listarKitsDisponibles = (idEvento) =>
  pedir(`/eventos/${idEvento}/kits-disponibles?id_dueno=${idDueno()}`);

// RF-P1-05: asigna un kit al evento (la respuesta trae "advertencias")
export const reservarKit = (idEvento, idKit) =>
  pedir(`/eventos/${idEvento}/kits`, {
    method: "POST",
    body: { id_kit: idKit, id_dueno: idDueno() },
  });

// Quita un kit del evento
export const quitarKit = (idEvento, idReserva) =>
  pedir(`/eventos/${idEvento}/kits/${idReserva}`, { method: "DELETE" });
