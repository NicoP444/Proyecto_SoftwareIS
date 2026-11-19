import { auspiciadorService } from '../services/auspiciador.service.js';

export const auspiciadorController = {
  // OBTENER TODOS
  async obtenerTodos(req, res) {
    try {
      const auspiciadores = await auspiciadorService.obtenerTodos();
      res.status(200).json(auspiciadores);
    } catch (error) {
      const msg = error.message || 'Ocurrió un error al obtener los auspiciadores.';
      res.status(500).json({ mensaje: msg, error: msg });
    }
  },

  // REGISTRAR AUSPICIADOR
  async crear(req, res) {
    try {
      const nuevoAuspiciador = await auspiciadorService.crear(req.body);
      res.status(201).json(nuevoAuspiciador);
    } catch (error) {
      const msg = error.message || 'Ocurrió un error al registrar el auspiciador.';
      res.status(400).json({ mensaje: msg, error: msg });
    }
  },

  // MODIFICAR AUSPICIADOR
  async modificar(req, res) {
    try {
      const id = req.params.id;
      const datosActualizados = await auspiciadorService.modificar(id, req.body);
      res.status(200).json(datosActualizados);
    } catch (error) {
      const msg = error.message || 'Ocurrió un error al modificar el auspiciador.';
      res.status(400).json({ mensaje: msg, error: msg });
    }
  },

  // ELIMINAR AUSPICIADOR
  async eliminar(req, res) {
    try {
      const id = req.params.id;
      await auspiciadorService.eliminar(id);
      res.status(200).json({ mensaje: 'Auspiciador eliminado con éxito.' });
    } catch (error) {
      const msg = error.message || 'No se puede eliminar el auspiciador.';
      res.status(400).json({ mensaje: msg, error: msg });
    }
  }
};