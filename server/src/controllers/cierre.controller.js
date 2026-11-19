import { manejarError } from '../utils/errores.js';
import * as service from '../services/cierre.service.js';

export const revisar = async (req, res) => {
  try{
    return res.json(await service.revisarCierre(Number(req.params.id)));
  }catch (error){
    return manejarError(res, error);
  }
};

export const cerrar = async (req, res) => {
  try{
    const confirmar = req.body.confirmar === true || req.body.confirmar === 'true';
    const resultado = await service.cerrarJornada(Number(req.params.id), Number(req.body.id_dueno), confirmar);

    // Hay advertencias y el Dueño aún no confirma: se informa y no se cierra
    if(!resultado.cerrado){
      return res.status(409).json({
        mensaje: 'Hay advertencias pendientes. Para cerrar igual, envía confirmar: true',
        advertencias: resultado.advertencias,
      });
    }
    return res.json(resultado);
  }catch (error){
    return manejarError(res, error);
  }
};