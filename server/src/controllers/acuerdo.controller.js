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

// Registrar cumplimiento del aporte (RF-P4-04)
export const registrarCumplimiento = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Datos recibidos para cumplimiento:', { id, body: req.body });
    const acuerdoActualizado = await acuerdoService.registrarCumplimiento(id, req.body);
    res.json(acuerdoActualizado);
  } catch (error) {
    console.error('Error exacto en registrarCumplimiento:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};

// Declarar aporte incobrable (RF-P4-06)
export const declararIncobrable = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_incobrable } = req.body;
    console.log('Declarando incobrable:', { id, motivo_incobrable });

    const acuerdoActualizado = await acuerdoService.declararIncobrable(id, motivo_incobrable);
    res.json(acuerdoActualizado);
  } catch (error) {
    console.error('Error en declararIncobrable:', error);
    res.status(400).json({ error: error.message || 'Error al declarar el acuerdo como incobrable' });
  }
};

// Modificar acuerdo (glosa, monto, fecha, tipo de aporte, etc.)
export const modificarAcuerdo = async (req, res) => {
  try {
    const { id } = req.params;
    const acuerdoActualizado = await acuerdoService.modificar(id, req.body);
    res.json(acuerdoActualizado);
  } catch (error) {
    console.error('Error al modificar acuerdo:', error);
    res.status(400).json({ error: error.message || 'Error al modificar el acuerdo' });
  }
};

// Eliminar acuerdo y sus cumplimientos asociados
export const eliminarAcuerdo = async (req, res) => {
  try {
    const { id } = req.params;
    await acuerdoService.eliminar(id);
    res.json({ mensaje: 'Acuerdo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar acuerdo:', error);
    res.status(400).json({ error: error.message || 'Error al eliminar el acuerdo' });
  }
};