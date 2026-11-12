import { API_URL } from './config.js';

// funcion que recibe la respuesta que entrega fetch despues de comunicarse al backend
async function manejarRespuesta(response) {
  const data = await response.json().catch(() => ({})); // transformamos a obj js y en caso que falle data = {}
  if (!response.ok) throw new Error(data.mensaje || 'Ocurrió un error'); // si falla la respuesta creamos y lanzamos error
  return data; // la peticion fue exitosa y retornamos
}

const cabeceras = { 'Content-Type': 'application/json' };

// buscar y limite son opcionales: con ellos el back filtra por nombre o RUT
export const listarClientes = ({ buscar = '', limite } = {}) => {
  const params = new URLSearchParams();
  if (buscar) params.set('buscar', buscar);
  if (limite) params.set('limite', limite);
  return fetch(`${API_URL}/clientes?${params}`).then(manejarRespuesta);
};

export const crearCliente = (cliente) => fetch(`${API_URL}/clientes`, {
  method: 'POST', headers: cabeceras, body: JSON.stringify(cliente)
}).then(manejarRespuesta);

export const modificarCliente = (id, cliente) => fetch(`${API_URL}/clientes/${id}`, {
  method: 'PUT', headers: cabeceras, body: JSON.stringify(cliente)
}).then(manejarRespuesta);

export const eliminarCliente = (id) => fetch(`${API_URL}/clientes/${id}`, {
  method: 'DELETE'
}).then(manejarRespuesta);