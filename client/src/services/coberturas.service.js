import { API_URL } from './config.js';

async function manejarRespuesta(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.mensaje || 'Ocurrió un error');
  return data;
}

export const listarClientes = () => fetch(`${API_URL}/clientes`).then(manejarRespuesta);
export const crearCliente = (cliente) => fetch(`${API_URL}/clientes`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cliente)
}).then(manejarRespuesta);

export const listarCoberturas = () => fetch(`${API_URL}/coberturas`).then(manejarRespuesta);
export const crearCobertura = (cobertura) => fetch(`${API_URL}/coberturas`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cobertura)
}).then(manejarRespuesta);
export const eliminarCobertura = async (id) => {
  const response = await fetch(`${API_URL}/coberturas/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.mensaje || 'No se pudo eliminar la cobertura');
  }
};