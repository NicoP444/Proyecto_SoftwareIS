import { pedir } from './http.js';

export const kitClientService = {
  async obtenerKits() {
    return pedir('/kits');
  },

  async crearKit(datosKit) {
    return pedir('/kits', {
      method: 'POST',
      body: datosKit,
    });
  },

  async actualizarKit(idKit, datosKit) {
    return pedir(`/kits/${idKit}`, {
      method: 'PUT',
      body: datosKit,
    });
  },

  async eliminarKit(idKit) {
    return pedir(`/kits/${idKit}`, {
      method: 'DELETE',
    });
  },
};