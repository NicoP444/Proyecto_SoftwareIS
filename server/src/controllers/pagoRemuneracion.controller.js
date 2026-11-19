import { manejarError } from '../utils/errores.js';
import { validarPago } from '../schemas/PagoRemuneracion.schemas.js';
import * as service from '../services/PagoRemuneracion.service.js';

export const listarPorEvento = async (req, res) => {
  try{
    return res.json(await service.listarPorEvento(Number(req.params.id)));
  }catch (error){
    return manejarError(res, error);
  }
};

export const registrar = async (req, res) => {
  try{
    const datos = validarPago(req.body);
    const resultado = await service.registrarPago(Number(req.params.id), datos);

    // El monto difiere del calculado y el Contador aún no confirma: se avisa y no se registra
    if(!resultado.registrado){
      const { calculado, monto } = resultado.advertencia;
      return res.status(409).json({
        mensaje: `El monto pagado (${monto}) difiere del calculado (${calculado}). Para registrarlo igual, envía confirmar: true`,
        advertencia: resultado.advertencia,
      });
    }
    return res.status(201).json(resultado);
  }catch (error){
    return manejarError(res, error);
  }
};