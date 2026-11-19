import { acuerdoService } from '../services/acuerdo.service.js';

export const obtenerAcuerdos = async (req, res) => {
  try {
    const acuerdos = await acuerdoService.obtenerTodos();
    res.json(acuerdos);
  } catch (error) {
    console.error('Error al obtener acuerdos:', error);
    res.status(500).json({ mensaje: error.message || 'Error al obtener acuerdos', error: error.message });
  }
};

export const crearAcuerdo = async (req, res) => {
  try {
    const nuevoAcuerdo = await acuerdoService.crear(req.body);
    res.status(201).json(nuevoAcuerdo);
  } catch (error) {
    console.error('Error al crear acuerdo:', error);
    res.status(400).json({ mensaje: error.message || 'Error al crear acuerdo', error: error.message });
  }
};

export const registrarCumplimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const acuerdoActualizado = await acuerdoService.registrarCumplimiento(id, req.body);
    res.json(acuerdoActualizado);
  } catch (error) {
    console.error('Error exacto en registrarCumplimiento:', error);
    res.status(400).json({ mensaje: error.message || 'Error al registrar cumplimiento', error: error.message });
  }
};

export const declararIncobrable = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_incobrable } = req.body;
    const acuerdoActualizado = await acuerdoService.declararIncobrable(id, motivo_incobrable);
    res.json(acuerdoActualizado);
  } catch (error) {
    console.error('Error en declararIncobrable:', error);
    res.status(400).json({ mensaje: error.message || 'Error al declarar el acuerdo como incobrable', error: error.message });
  }
};

export const modificarAcuerdo = async (req, res) => {
  try {
    const { id } = req.params;
    const acuerdoActualizado = await acuerdoService.modificar(id, req.body);
    res.json(acuerdoActualizado);
  } catch (error) {
    console.error('Error al modificar acuerdo:', error);
    res.status(400).json({ mensaje: error.message || 'Error al modificar el acuerdo', error: error.message });
  }
};

export const eliminarAcuerdo = async (req, res) => {
  try {
    const { id } = req.params;
    await acuerdoService.eliminar(id);
    res.json({ mensaje: 'Acuerdo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar acuerdo:', error);
    res.status(400).json({ mensaje: error.message || 'Error al eliminar el acuerdo', error: error.message });
  }
};