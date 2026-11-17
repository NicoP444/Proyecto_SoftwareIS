import { auspiciadorService } from '../services/auspiciador.service.js';

export const auspiciadorController = {

  //OBTENER TODOS 
  async obtenerTodos(req, res) {
    try {
      const auspiciadores = await auspiciadorService.obtenerTodos();
      res.status(200).json(auspiciadores);
    } catch (error) {
      res.status(500).json({ error: "Ocurrió un error al obtener los auspiciadores." });
    }
  },

  //REGISTRAR AUSPICIADOR
  async crear(req, res) {
    try {
      const nuevoAuspiciador = await auspiciadorService.crear(req.body);
      res.status(201).json(nuevoAuspiciador);
    } catch (error) {
      res.status(500).json({ error: error.message || "Ocurrió un error al registrar el auspiciador." });
    }
  },
  
  //MODIFICAR AUSPICIADOR
async modificar(req, res) {
    try {
      const id = req.params.id;
      const datosActualizados = await auspiciadorService.modificar(id, req.body);
      res.status(200).json(datosActualizados);
    } catch (error) {
      res.status(500).json({ error: "Ocurrió un error al modificar el auspiciador." });
    }
  },

  //ELIMINAR AUSPICIADOR
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