import { API_URL } from './config.js';
import { pedir } from './http.js';

// pedir() solo envía JSON; para subir la evidencia (archivo) se usa FormData
async function enviarArchivo(ruta, method, formData) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = 'Bearer ' + token;

  const respuesta = await fetch(API_URL + ruta, { method, headers, body: formData });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.mensaje || 'Ocurrió un error');
  return datos;
}

// Eventos (módulo de Persona 1)
export const listarEventos = () => pedir('/coberturas');

// Gastos (RF-P7-02 y RF-P7-03)
export const listarGastos = (idEvento) => pedir(`/gastosEvento/evento/${idEvento}`);
export const crearGasto = (formData) => enviarArchivo('/gastosEvento', 'POST', formData);
export const modificarGasto = (id, formData) => enviarArchivo(`/gastosEvento/${id}`, 'PUT', formData);
export const eliminarGasto = (id, body) => pedir(`/gastosEvento/${id}`, { method: 'DELETE', body });

// Rendiciones (RF-P7-04)
export const listarRendiciones = (idEvento) => pedir(`/rendiciones/evento/${idEvento}`);
export const marcarRendicion = (idAsignacion, body) =>
  pedir(`/rendiciones/${idAsignacion}`, { method: 'PATCH', body });

// Las evidencias las sirve el back en /uploads (fuera de /api)
export const urlEvidencia = (ruta) => `${API_URL.replace(/\/api\/?$/, '')}/${ruta}`;