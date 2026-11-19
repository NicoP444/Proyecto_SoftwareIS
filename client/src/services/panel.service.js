import { pedir } from "./http.js";

// RF-T-07: datos del panel de inicio según el rol (DUENO, CONTADOR o JEFE_TECNICO)
export const obtenerPanel = (rol) => pedir(`/panel/${rol}`);
