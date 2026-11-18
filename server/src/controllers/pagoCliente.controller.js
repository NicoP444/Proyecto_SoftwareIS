import { manejarError } from '../utils/errores.js';
import { listarPagos, registrarPago } from '../services/pagoCliente.service.js';

export const listar = async (req, res) => {
  try {
    res.json(await listarPagos(Number(req.params.id), req.user.id_dueno));
  } catch (error) { manejarError(res, error); }
};

export const registrar = async (req, res) => {
  try {
    const resultado = await registrarPago(Number(req.params.id), req.body);

    // Los pagos superarían el precio y el Contador aún no confirma: se avisa y no se registra
    if (!resultado.registrado) {
      return res.status(409).json({
        mensaje: `Con este pago el total superaría el precio acordado en $${resultado.advertencia.excedente}. Para registrarlo igual, envía confirmar: true`,
        advertencia: resultado.advertencia,
      });
    }

    res.status(201).json(resultado);
  } catch (error) { manejarError(res, error); }
};