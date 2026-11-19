import { API_URL } from "./config.js";
import { cabecerasAuth, revisarSesion } from "./http.js";

// funcion que recibe la respuesta que entrega fetch despues de comunicarse al backend
async function manejarRespuesta(response) {
  revisarSesion(response); // si la sesión venció, vuelve al login
  const data = await response.json().catch(() => ({})); // transformamos a obj js y en caso que falle data = {}
  if (!response.ok) throw new Error(data.mensaje || "Ocurrió un error"); // si falla la respuesta creamos y lanzamos error
  return data; // la peticion fue exitosa y retornamos
}

const JSON_HEADERS = { "Content-Type": "application/json" };

// buscar y limite son opcionales: con ellos el back filtra por nombre o RUT
export const listarClientes = ({ buscar = "", limite } = {}) => {
  const params = new URLSearchParams();
  if (buscar) params.set("buscar", buscar);
  if (limite) params.set("limite", limite);
  return fetch(`${API_URL}/clientes?${params}`, {
    headers: cabecerasAuth(),
  }).then(manejarRespuesta);
};

export const crearCliente = (cliente) =>
  fetch(`${API_URL}/clientes`, {
    method: "POST",
    headers: cabecerasAuth(JSON_HEADERS),
    body: JSON.stringify(cliente),
  }).then(manejarRespuesta);

export const modificarCliente = (id, cliente) =>
  fetch(`${API_URL}/clientes/${id}`, {
    method: "PUT",
    headers: cabecerasAuth(JSON_HEADERS),
    body: JSON.stringify(cliente),
  }).then(manejarRespuesta);

export const eliminarCliente = (id) =>
  fetch(`${API_URL}/clientes/${id}`, {
    method: "DELETE",
    headers: cabecerasAuth(),
  }).then(manejarRespuesta);
