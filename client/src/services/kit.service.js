const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const kitClientService = {
  async obtenerKits() {
    try {
      const response = await fetch(`${API_URL}/kits`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al obtener los kits');
      }
      return data;
    } catch (error) {
      throw new Error(error.message || 'Error de conexión con el servidor');
    }
  },

  async crearKit(datosKit) {
    try {
      const response = await fetch(`${API_URL}/kits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosKit),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al crear el kit');
      }

      return data;
    } catch (error) {
      throw new Error(error.message || 'Error de conexión con el servidor');
    }
  },
};