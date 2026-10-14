// Importamos la "cocina" (el servicio que acabas de crear)
import { auspiciadorService } from '../services/auspiciador.service.js';

export const auspiciadorController = {
  // 0. LISTAR TODOS
  async obtenerTodos(req, res) {
    try {
      const auspiciadores = await auspiciadorService.obtenerTodos();
      res.status(200).json(auspiciadores);
    } catch (error) {
      res.status(500).json({ error: "Ocurrió un error al obtener los auspiciadores." });
    }
  },

  // 1. REGISTRAR
  async crear(req, res) {
    try {
      const nuevoAuspiciador = await auspiciadorService.crear(req.body);
      res.status(201).json(nuevoAuspiciador);
    } catch (error) {
      res.status(500).json({ error: "Ocurrió un error al registrar el auspiciador." });
    }
  },

  // 2. MODIFICAR
  async modificar(req, res) {
    try {
      const id = req.params.id;
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
      if (error.message.includes("tiene acuerdos")) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Ocurrió un error al eliminar el auspiciador." });
    }
  }
};