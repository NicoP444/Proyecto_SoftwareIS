import { API_URL } from './config.js';

// funcion que recibe la respuesta que entrega fetch despues de comunicarse al backend
async function manejarRespuesta(response) {
  const data = await response.json().catch(() => ({})); // transformamos a obj js y en caso que falle data = {}
  if (!response.ok) throw new Error(data.mensaje || 'Ocurrió un error'); // si falla la respuesta creamos y lanzamos error
  return data; // la peticion fue exitosa y retornamos
}

export const listarClientes = () => fetch(`${API_URL}/clientes`).then(manejarRespuesta);

// recibe cliente que viene de await crearCliente(nuevoCliente)
export const crearCliente = (cliente) => fetch(`${API_URL}/clientes`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cliente)
}).then(manejarRespuesta);