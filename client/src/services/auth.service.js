import { API_URL } from './config.js';

export const login = async (correo, contrasena) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ correo, contrasena }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.mensaje || 'Error al iniciar sesión');
  }

  return data;
};

export const logout = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Si falla la red, igual limpiamos la sesión en el navegador
  }
};