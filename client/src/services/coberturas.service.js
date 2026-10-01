import { API_URL } from './config.js';

//funcion que recibe la respuesta que entrega fetch despues de comunicarse al backend
async function manejarRespuesta(response) {
  const data = await response.json().catch(() => ({}));//transformamos a obj js y en caso que falle data = {}
  if (!response.ok) throw new Error(data.mensaje || 'Ocurrió un error'); //si falla la respuesta creamos y lanzamos error
  return data; //la peticion fue exitosa y retornamos
}

export const listarCoberturas = () => fetch(`${API_URL}/coberturas`).then(manejarRespuesta);
export const crearCobertura = (cobertura) => fetch(`${API_URL}/coberturas`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cobertura)
}).then(manejarRespuesta);

export const eliminarCobertura = async (id) => {
  const response = await fetch(`${API_URL}/coberturas/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})); //esperamos la respuesta mientras se intenta obtener el mensaje
    throw new Error(data.mensaje || 'No se pudo eliminar la cobertura');
  }
};