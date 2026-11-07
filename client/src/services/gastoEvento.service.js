import { API_URL } from './config.js';
import { pedir } from './http.js';

// pedir() fuerza JSON, así que para enviar archivos (FormData) uso esta variante.
async function pedirConArchivo(ruta, method, formData) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = 'Bearer ' + token;

  const respuesta = await fetch(API_URL + ruta, { method, headers, body: formData });
  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || `Error ${respuesta.status} en ${method} ${ruta}`);
  }
  return datos;
}

const comoLista = (datos, ...claves) =>
  Array.isArray(datos) ? datos : claves.map((c) => datos[c]).find(Array.isArray) ?? [];

// Eventos (módulo de Jorge: /coberturas)
export const listarEventos = async () => comoLista(await pedir('/coberturas'), 'eventos', 'data');

// Trabajadores (módulo de Personal). Si tu compañero ya tiene una función para listarlos,
// puedes importar esa en vez de esta.
export const listarTrabajadores = async () => comoLista(await pedir('/trabajadores'), 'trabajadores', 'data');

// Gastos (RF-P7-02 y RF-P7-03)
export const listarGastos = (idEvento) => pedir(`/gastosEvento/evento/${idEvento}`);
export const crearGasto = (formData) => pedirConArchivo('/gastosEvento', 'POST', formData);
export const modificarGasto = (idGasto, formData) =>
  pedirConArchivo(`/gastosEvento/${idGasto}`, 'PUT', formData);
export const eliminarGasto = (idGasto, body) =>
  pedir(`/gastosEvento/${idGasto}`, { method: 'DELETE', body });

// RENDICIONES (pendiente): descomentar cuando el back tenga /rendiciones
 export const listarRendiciones = (idEvento) => pedir(`/rendiciones/evento/${idEvento}`);
 export const marcarRendicion = (idAsignacion, body) =>
 pedir(`/rendiciones/${idAsignacion}`, { method: 'PATCH', body });

// Las evidencias las sirve el back en /uploads (fuera de /api)
export const urlEvidencia = (ruta) => `${API_URL.replace(/\/api\/?$/, '')}/${ruta}`;