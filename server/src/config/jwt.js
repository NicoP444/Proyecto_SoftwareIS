// Clave con la que se firman y verifican los tokens de sesión (el login y el middleware usan la misma)
if (!process.env.JWT_SECRET) {
  throw new Error('Falta la variable JWT_SECRET en el .env');
}

export const JWT_SECRET = process.env.JWT_SECRET;