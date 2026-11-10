// Deja el RUT sin puntos ni guion y con la K en mayúscula: "12.345.678-5" -> "123456785"
export function limpiarRut(rut = '') {
  return String(rut).replace(/[^0-9kK]/g, '').toUpperCase();
}

// Calcula el dígito verificador con el método módulo 11
function calcularDv(cuerpo) {
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

// true si el RUT tiene 7 u 8 dígitos y el dígito verificador coincide
export function rutEsValido(rut) {
  const limpio = limpiarRut(rut);
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return false;
  return calcularDv(limpio.slice(0, -1)) === limpio.slice(-1);
}