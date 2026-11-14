import { pedir } from './http.js';
import { API_URL } from './config.js';

export function listarGastosFijos(anio, mes) {
  return pedir(`/gastos-fijos?anio=${anio}&mes=${mes}`);
}

export async function registrarGastoFijo(formData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/gastos-fijos`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.mensaje || data.error || 'Error al registrar gasto fijo');
  }
  return data;
}