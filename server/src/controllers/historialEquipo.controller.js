import { obtenerHistorialEquipoService } from '../services/historialEquipo.service.js';

export const obtenerHistorialEquipo = async (req, res) => {
  const { codigo } = req.params;

  try {
    const resultado = await obtenerHistorialEquipoService(codigo);

    if (!resultado) {
      return res.status(404).json({ mensaje: 'Equipo no encontrado' });
    }

    return res.json(resultado);
  } catch (error) {
    console.error('Error al consultar historial del equipo:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar el historial' });
  }
};