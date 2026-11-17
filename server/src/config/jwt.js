// Clave con la que se firman y verifican los tokens de sesión (el login y el middleware usan la misma)
export const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_por_defecto';