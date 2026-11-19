import { API_URL } from './config.js';

//coneccion del back-end

// Devuelve el usuario que inició sesión (lo guardó el Login en el navegador)
export function obtenerUsuario() {
  const guardado = localStorage.getItem('usuario');
  return guardado ? JSON.parse(guardado) : null;
}

// Cabeceras con el token, para los services que usan fetch directo
export function cabecerasAuth(extra = {}) {
  const token = localStorage.getItem('token');
  return token ? { ...extra, Authorization: 'Bearer ' + token } : extra;
}

// Si el back responde 401 (sin sesión o sesión vencida), borramos la sesión y volvemos al login
export function revisarSesion(respuesta) {
  if (respuesta.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/';
  }
}

// Función que usan todos los services para hablar con el back
export async function pedir(ruta, opciones = {}) {
  const headers = { 'Content-Type': 'application/json' };

  // Si hay sesión, enviamos el token
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = 'Bearer ' + token;

  const respuesta = await fetch(API_URL + ruta, {
    method: opciones.method || 'GET',
    headers,
    body: opciones.body ? JSON.stringify(opciones.body) : undefined,
  });

  revisarSesion(respuesta);

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || 'Ocurrió un error');
  }

  return datos;
}