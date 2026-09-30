import { API_URL } from './config.js';

// Devuelve el usuario que inició sesión (lo guardó el Login en el navegador)
export function obtenerUsuario() {
  const guardado = localStorage.getItem('usuario');
  return guardado ? JSON.parse(guardado) : null;
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

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || 'Ocurrió un error');
  }

  return datos;
}