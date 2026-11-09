// Error para cuando el usuario manda un dato inválido.
// "field" indica qué campo falló.
export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.field = field;
  }
}

// error, por si no los encuentra...
export class NotFoundError extends Error {
  constructor(message) {
    super(message);
  }
}

// Decide qué respuesta enviar según el tipo de error
export const manejarError = (res, error) => {
  // Error de validación: el usuario debe corregir el dato (400)
  if (error instanceof ValidationError) {
    return res.status(400).json({ mensaje: error.message, campo: error.field });
  }

   if (error instanceof NotFoundError) {
    return res.status(404).json({ mensaje: error.message });
  }

  // Prisma: se repitió un valor @unique (409)
  if (error.code === 'P2002') {
    return res.status(409).json({
      mensaje: 'Ya existe un registro con ese valor',
      campo: error.meta?.target?.[0],
    });
  }

  // Cualquier otro error es del servidor (500)
  console.error(error);
  return res.status(500).json({ mensaje: 'Error interno del servidor' });
};