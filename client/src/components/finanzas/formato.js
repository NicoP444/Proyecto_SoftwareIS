export const TIPOS = {
  MOVILIZACION: 'Movilización',
  PEAJE: 'Peaje',
  PASAJE: 'Pasaje',
  ALIMENTACION: 'Alimentación',
  OTRO: 'Otro',
};

export const clp = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n ?? 0);

// "2026-11-10T00:00:00.000Z" -> "10-11-2026" (sin desfase de zona horaria)
export const formatearFecha = (f) => {
  if (!f) return '';
  const [a, m, d] = String(f).slice(0, 10).split('-');
  return `${d}-${m}-${a}`;
};