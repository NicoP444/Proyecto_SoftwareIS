import { acuerdoService } from '../services/acuerdo.service.js';

export const obtenerAcuerdos = async (req, res) => {
  try {
    const acuerdos = await acuerdoService.obtenerTodos();
    res.json(acuerdos);
  } catch (error) {
    console.error('Error al obtener acuerdos:', error);
    res.status(500).json({ error: error.message });
  }
};

export const crearAcuerdo = async (req, res) => {
  try {
    const nuevoAcuerdo = await acuerdoService.crear(req.body);
    res.status(201).json(nuevoAcuerdo);
  } catch (error) {
    console.error('Error al crear acuerdo:', error);
    res.status(500).json({ error: error.message });
  }
};