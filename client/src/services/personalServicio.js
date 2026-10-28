/**
 * Todas las llamadas al back del módulo de Personal.
 * Los componentes NUNCA usan fetch directo: siempre pasan por aquí.
 *
 * ⚠️ Si alguna ruta de tu back es distinta, cámbiala solo en este archivo.
 */
import { pedir } from './http.js'; // tu archivo con la función pedir

// El back (validarDueno) pide id_dueno. Es el id del usuario que inició sesión.
function idDueno() {
  const usuario = JSON.parse(localStorage.getItem('usuario') ?? 'null');
  return usuario?.id;
}

// El front siempre necesita una lista. Si el back la manda envuelta
// (ej: { disponibilidad: [...] }) la sacamos; si no viene, usamos [].
function comoLista(respuesta) {
  if (Array.isArray(respuesta)) return respuesta;
  return Object.values(respuesta ?? {}).find(Array.isArray) ?? [];
}

// ---------- Trabajadores ----------
export async function listarTrabajadores() {
  return comoLista(await pedir(`/trabajadores?id_dueno=${idDueno()}`));
}

export function crearTrabajador(datos) {
  return pedir('/trabajadores', { method: 'POST', body: { ...datos, id_dueno: idDueno() } });
}

export function actualizarTrabajador(id, datos) {
  return pedir(`/trabajadores/${id}`, { method: 'PUT', body: { ...datos, id_dueno: idDueno() } });
}

// ---------- Roles ----------
export async function listarRoles() {
  return comoLista(await pedir(`/rol?id_dueno=${idDueno()}`));
}

export function crearRol(datos) {
  return pedir('/rol', { method: 'POST', body: { ...datos, id_dueno: idDueno() } });
}

export function actualizarRol(id, datos) {
  return pedir(`/rol/${id}`, { method: 'PUT', body: { ...datos, id_dueno: idDueno() } });
}

// ---------- Roles de un trabajador (tabla desempeña) ----------
// Rutas del back: POST y DELETE /trabajadores/:id/rol/:idRol
export function asignarRol(idTrabajador, idRol) {
  return pedir(`/trabajadores/${idTrabajador}/rol/${idRol}?id_dueno=${idDueno()}`, {
    method: 'POST',
    body: { id_dueno: idDueno() },
  });
}

export function quitarRol(idTrabajador, idRol) {
  return pedir(`/trabajadores/${idTrabajador}/rol/${idRol}?id_dueno=${idDueno()}`, {
    method: 'DELETE',
  });
}

// ---------- Disponibilidad (bloques de fechas con horario) ----------
// Rutas del back: GET, POST y PUT /trabajadores/:id/disponibilidad
export async function listarDisponibilidad(idTrabajador) {
  // El back responde { disponibilidades: [...] }; comoLista saca el arreglo
  return comoLista(await pedir(`/trabajadores/${idTrabajador}/disponibilidad?id_dueno=${idDueno()}`));
}

/** bloque = { fecha_inicio, fecha_termino, hora_inicio, hora_termino } */
export function crearBloqueDisponibilidad(idTrabajador, bloque) {
  return pedir(`/trabajadores/${idTrabajador}/disponibilidad`, {
    method: 'POST',
    body: { ...bloque, id_dueno: idDueno() },
  });
}

export function actualizarBloqueDisponibilidad(idTrabajador, nroBloque, bloque) {
  return pedir(`/trabajadores/${idTrabajador}/disponibilidad/${nroBloque}`, {
    method: 'PUT',
    body: { ...bloque, id_dueno: idDueno() },
  });
}