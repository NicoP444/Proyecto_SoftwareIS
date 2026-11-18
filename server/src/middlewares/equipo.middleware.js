import prisma from '../config/prisma.js';

// Verifica que el equipo exista por su :codigo
export const validarEquipoExiste = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const equipo = await prisma.equipo.findUnique({
      where: { codigo },
      include: {
        incidentes: true,
        revisiones: true,
        kit: true
      }
    });

    if (!equipo) {
      return res.status(404).json({
        mensaje: `El equipo con código ${codigo} no existe.`,
        error: `El equipo con código ${codigo} no existe.`
      });
    }

    req.equipo = equipo;
    next();
  } catch (error) {
    next(error);
  }
};

// Evita dar de baja un equipo que ya fue dado de baja antes
export const validarEquipoNoDadoDeBaja = (req, res, next) => {
  if (req.equipo?.estado === 'DADO_DE_BAJA') {
    return res.status(400).json({
      mensaje: 'Este equipo ya se encuentra dado de baja.',
      error: 'Este equipo ya se encuentra dado de baja.'
    });
  }
  next();
};

// RF-P5-03: Solo permite eliminar definitivamente si NO tiene historial de uso
export const validarSinHistorialParaEliminar = (req, res, next) => {
  const tieneIncidentes = (req.equipo?.incidentes?.length || 0) > 0;
  const tieneRevisiones = (req.equipo?.revisiones?.length || 0) > 0;

  if (tieneIncidentes || tieneRevisiones) {
    return res.status(400).json({
      mensaje: 'No se puede eliminar definitivamente porque el equipo registra historial de uso.',
      error: 'No se puede eliminar definitivamente porque el equipo registra historial de uso.'
    });
  }
  next();
};