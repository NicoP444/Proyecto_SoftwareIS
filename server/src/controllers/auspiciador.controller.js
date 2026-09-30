// Importamos la "cocina" (el servicio que acabas de crear)
import { auspiciadorService } from '../services/auspiciador.service.js';

export const auspiciadorController = {
  
  // 1. REGISTRAR
  async crear(req, res) {
    try {
      // El mesero recibe los datos del formulario (req.body) y los manda a la cocina
      const nuevoAuspiciador = await auspiciadorService.crear(req.body);
      // El mesero responde que quedó listo (201 Created)
      res.status(201).json(nuevoAuspiciador);
    } catch (error) {
      res.status(500).json({ error: "Ocurrió un error al registrar el auspiciador." });
    }
  },

  // 2. MODIFICAR
  async modificar(req, res) {
    try {
      const id = req.params.id; // Sacamos el ID de la dirección (ej: /auspiciadores/5)
      const datosActualizados = await auspiciadorService.modificar(id, req.body);
      res.status(200).json(datosActualizados);
    } catch (error) {
      res.status(500).json({ error: "Ocurrió un error al modificar el auspiciador." });
    }
  },

  // 3. ELIMINAR
  async eliminar(req, res) {
    try {
      const id = req.params.id;
      await auspiciadorService.eliminar(id);
      res.status(200).json({ mensaje: "Auspiciador eliminado con éxito." });
    } catch (error) {
      // Si la cocina arrojó el error de la regla de negocio (RF-P4-01), se lo mandamos al usuario
      if (error.message.includes("tiene acuerdos")) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Ocurrió un error al eliminar el auspiciador." });
    }
  }
};