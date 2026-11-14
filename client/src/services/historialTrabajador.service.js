import { pedir } from './http.js';

export const verHistorialTrabajador = (idTrabajador) => pedir(`/historial-trabajador/${idTrabajador}`);