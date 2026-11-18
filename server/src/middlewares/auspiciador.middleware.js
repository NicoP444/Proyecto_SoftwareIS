export const validarAuspiciador = (req, res, next) => {
  const { telefono } = req.body;

  if (telefono) {
    // Permite un '+' opcional al comienzo seguido de 7 a 15 dígitos numéricos
    const telefonoRegex = /^\+?\d{7,15}$/;
    
    // Validar explícitamente si contiene alguna letra
    const contieneLetras = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(telefono);

    if (contieneLetras || !telefonoRegex.test(telefono)) {
      return res.status(400).json({
        error: "El teléfono no puede contener letras y debe tener entre 7 y 15 dígitos numéricos."
      });
    }
  }

  next();
};