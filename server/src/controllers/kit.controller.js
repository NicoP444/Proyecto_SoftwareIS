import { kitService } from '../services/kit.service.js';
import { manejarError } from '../utils/errores.js';

export const kitController = {
  async listar(req, res) {
    try {
      const kits = await kitService.listar();
      return res.status(200).json(kits);
    } catch (error) {
      return manejarError(res, error);
    }
  },

  async crear(req, res) {
    try {
      const kit = await kitService.crear(req.body);
      return res.status(201).json({
        mensaje: 'Kit creado exitosamente',
        data: kit,
      });
    } catch (error) {
      return manejarError(res, error);
    }
  },

  async actualizar(req, res) {
    try {
      const kit = await kitService.actualizar(req.params.id, req.body);
      return res.status(200).json({
        mensaje: 'Kit actualizado exitosamente',
        data: kit,
      });
    } catch (error) {
      return manejarError(res, error);
    }
  },

  async eliminar(req, res) {
    try {
      const resultado = await kitService.eliminar(req.params.id);
      return res.status(200).json(resultado);
    } catch (error) {
      return manejarError(res, error);
    }
  },
};