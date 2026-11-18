import prisma from '../config/prisma.js';

// Verifica que el acuerdo exista en la BD cuando se recibe :id por parámetro
export const validarAcuerdoExiste = async (req, res, next) => {
  try {
    const id_acuerdo = Number(req.params.id);
    const acuerdo = await prisma.acuerdoAuspicio.findUnique({
      where: { id_acuerdo }
    });

    if (!acuerdo) {
      return res.status(404).json({ mensaje: 'El acuerdo de auspicio no existe.' });
    }

    req.acuerdo = acuerdo;
    next();
  } catch (error) {
    next(error);
  }
};

// Verifica que tanto el auspiciador como el evento existan al crear un acuerdo
export const validarRelacionesAcuerdo = async (req, res, next) => {
  try {
    const id_auspiciador = Number(req.body.id_auspiciador);
    const id_evento = Number(req.body.id_evento);

    const [auspiciador, evento] = await Promise.all([
      prisma.auspiciador.findUnique({ where: { id_auspiciador } }),
      prisma.evento.findUnique({ where: { id_evento } })
    ]);

    if (!auspiciador) {
      return res.status(404).json({ mensaje: 'El auspiciador seleccionado no existe.' });
    }

    if (!evento) {
      return res.status(404).json({ mensaje: 'El evento seleccionado no existe.' });
    }

    if (req.body.tipo_aporte === 'CANJE' && (!req.body.descripcion_canje || !req.body.descripcion_canje.trim())) {
      return res.status(400).json({ mensaje: 'Debes especificar la descripción del canje cuando el aporte es CANJE.' });
    }

    next();
  } catch (error) {
    next(error);
  }
};