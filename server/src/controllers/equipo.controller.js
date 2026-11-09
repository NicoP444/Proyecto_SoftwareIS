import { equipoService } from '../services/equipo.service.js';

export const obtenerEquipos = async (req, res) => {
  try {
    const equipos = await equipoService.obtenerTodos();
    res.json(equipos);
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    res.status(500).json({ error: error.message || 'Error al obtener equipos' });
  }
};

export const crearEquipo = async (req, res) => {
  try {
    const nuevoEquipo = await equipoService.crear(req.body);
    res.status(201).json(nuevoEquipo);
  } catch (error) {
    console.error('Error al registrar equipo:', error);
    res.status(400).json({ error: error.message || 'Error al registrar equipo' });
  }
};

export const modificarEquipo = async (req, res) => {
  try {
    const { codigo } = req.params;
    const equipoModificado = await equipoService.actualizar(codigo, req.body);
    res.json(equipoModificado);
  } catch (error) {
    console.error('Error al modificar equipo:', error);
    res.status(400).json({ error: error.message || 'Error al modificar equipo' });
  }
};