/**
 * Funciones pequeñas y constantes que usan varios componentes de Personal.
 * Los nombres de campos (id_trabajador, dia_semana, etc.) son los de Prisma.
 */

export const DIAS = [
  { numero: 1, corto: 'L', nombre: 'Lunes' },
  { numero: 2, corto: 'M', nombre: 'Martes' },
  { numero: 3, corto: 'M', nombre: 'Miércoles' },
  { numero: 4, corto: 'J', nombre: 'Jueves' },
  { numero: 5, corto: 'V', nombre: 'Viernes' },
  { numero: 6, corto: 'S', nombre: 'Sábado' },
  { numero: 7, corto: 'D', nombre: 'Domingo' },
];

export const ESTADOS = [
  { valor: 'activo', texto: 'Activo' },
  { valor: 'licencia', texto: 'Con licencia' },
  { valor: 'inactivo', texto: 'Inactivo' },
];

export function textoEstado(valor) {
  const estado = ESTADOS.find((e) => e.valor === valor);
  return estado ? estado.texto : 'Sin estado';
}

export function nombreCompleto(trabajador) {
  return `${trabajador.nombre ?? ''} ${trabajador.apellido ?? ''}`.trim();
}

/** "Marcos Soto" -> "MS" */
export function iniciales(nombre) {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}

/** Los roles vienen dentro de desempena (include en Prisma). */
export function rolesDe(trabajador) {
  return (trabajador.desempena ?? []).map((d) => d.rol).filter(Boolean);
}

/** "1970-01-01T09:00:00.000Z" o "09:00:00" -> "09:00" */
export function aHora(valor) {
  if (!valor) return '';
  const texto = String(valor);
  return texto.includes('T') ? texto.slice(11, 16) : texto.slice(0, 5);
}

/** "2026-10-01T00:00:00.000Z" -> "2026-10-01" (formato del input date) */
export function aFecha(valor) {
  return valor ? String(valor).slice(0, 10) : '';
}

/** "2026-10-01" -> "1 oct 2026" */
export function formatearFecha(fecha) {
  if (!fecha) return '';
  const [anio, mes, dia] = aFecha(fecha).split('-').map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Texto del período de la disponibilidad, ej: "1 oct 2026 al 31 oct 2026". */
export function textoPeriodo(disponibilidad) {
  const conFecha = disponibilidad.find((d) => d.fecha_inicio);
  if (!conFecha) return 'Sin período';
  return `${formatearFecha(conFecha.fecha_inicio)} al ${formatearFecha(conFecha.fecha_termino)}`;
}

/** Primer y último día del mes actual (para proponer un período por defecto). */
export function periodoMesActual() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const ultimoDia = new Date(anio, hoy.getMonth() + 1, 0).getDate();
  return { inicio: `${anio}-${mes}-01`, termino: `${anio}-${mes}-${ultimoDia}` };
}

/** Suma las horas de todos los días disponibles. */
export function horasSemanales(disponibilidad) {
  const minutos = disponibilidad.reduce((total, d) => {
    const [h1, m1] = aHora(d.hora_inicio).split(':').map(Number);
    const [h2, m2] = aHora(d.hora_termino).split(':').map(Number);
    return total + (h2 * 60 + m2) - (h1 * 60 + m1);
  }, 0);
  return Math.round(minutos / 60);
}

/** Frase corta para la tarjeta: muestra los fines de semana. */
export function resumenFinDeSemana(disponibilidad) {
  if (disponibilidad.length === 0) return 'Sin disponibilidad registrada';
  const findes = disponibilidad.filter((d) => d.dia_semana >= 6);
  if (findes.length === 0) return 'Sin fines de semana';
  return findes
    .map((d) => `${DIAS[d.dia_semana - 1].nombre} de ${aHora(d.hora_inicio)} a ${aHora(d.hora_termino)}`)
    .join(' · ');
}
