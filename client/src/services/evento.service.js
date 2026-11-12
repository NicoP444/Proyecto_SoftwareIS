import { API_URL } from './config.js';

//funcion que recibe la respuesta que entrega fetch despues de comunicarse al backend
async function manejarRespuesta(response) {
  const data = await response.json().catch(() => ({}));//transformamos a obj js y en caso que falle data = {}
  if (!response.ok) throw new Error(data.mensaje || 'Ocurrió un error'); //si falla la respuesta creamos y lanzamos error
  return data; //la peticion fue exitosa y retornamos
}

export const listarEventos = () => fetch(`${API_URL}/eventos`).then(manejarRespuesta);
export const crearEvento = (evento) => fetch(`${API_URL}/eventos`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(evento)
}).then(manejarRespuesta);

// RF-P1-07: modifica un evento. La respuesta trae "advertencias" (lista de avisos, puede venir vacía)
export const modificarEvento = (id, evento) => fetch(`${API_URL}/eventos/${id}`, {
  method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(evento)
}).then(manejarRespuesta);

export const eliminarEvento = async (id, motivo) => {
  const response = await fetch(`${API_URL}/eventos/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.mensaje || 'No se pudo eliminar el evento');
  }
};