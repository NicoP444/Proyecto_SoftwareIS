import { pedir } from './http.js'; // Ajusta la ruta si tu archivo se llama diferente

export async function getAlertasKitsSinRetorno() {
  return await pedir('/alertas/kits-sin-retorno');
}