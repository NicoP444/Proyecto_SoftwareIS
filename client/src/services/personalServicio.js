/**
 * Todas las llamadas al back del módulo de Personal.
 * Los componentes NUNCA usan fetch directo: siempre pasan por aquí.
 *
 * ⚠️ Si alguna ruta de tu back es distinta, cámbiala solo en este archivo.
 */
import { pedir } from './http.js'; // ⚠️ cambia './api.js' por el nombre real del archivo donde está "pedir"

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
export function asignarRol(idTrabajador, idRol) {
  return pedir('/desempena', {
    method: 'POST',
    body: { id_trabajador: idTrabajador, id_rol: idRol },
  });
}

export function quitarRol(idTrabajador, idRol) {
  return pedir(`/desempena/${idTrabajador}/${idRol}`, { method: 'DELETE' });
}

// ---------- Disponibilidad ----------
export async function listarDisponibilidad(idTrabajador) {
  return comoLista(await pedir(`/trabajadores/${idTrabajador}/disponibilidad`));
}

/**
 * Guarda la semana completa de forma simple:
 * 1) borra los registros que había
 * 2) crea uno por cada día marcado
 */
export async function guardarDisponibilidad(idTrabajador, anteriores, nuevos) {
  for (const registro of anteriores) {
    await pedir(`/trabajadores/${idTrabajador}/disponibilidad/${registro.id_disponibilidad}`, {
      method: 'DELETE',
    });
  }

  for (const registro of nuevos) {
    await pedir(`/trabajadores/${idTrabajador}/disponibilidad`, {
      method: 'POST',
      body: registro,
    });
  }
}
