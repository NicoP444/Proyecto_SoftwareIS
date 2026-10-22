/**
 * Funciones pequeñas y constantes que usan varios componentes de Personal.
 * Los nombres de campos (id_trabajador, fecha_inicio, etc.) son los de Prisma.
 */

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
  return (trabajador.nombre ?? '').trim();
}

/** "Marcos Soto" -> "MS" */
export function iniciales(nombre) {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}

/** Los roles vienen en trabajador.roles (include en Prisma). */
export function rolesDe(trabajador) {
  return (trabajador.roles ?? trabajador.desempena ?? []).map((d) => d.rol).filter(Boolean);
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

// ---------- Disponibilidad (bloques de fechas con horario) ----------

/** "2026-10-22" de hoy, para comparar con las fechas de los bloques */
function hoyComoTexto() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

/** Ordena los bloques por fecha de inicio (del más antiguo al más nuevo) */
export function ordenarBloques(disponibilidad) {
  return [...disponibilidad].sort((a, b) => aFecha(a.fecha_inicio).localeCompare(aFecha(b.fecha_inicio)));
}

/**
 * Bloque que se muestra en la tarjeta:
 * el que está vigente hoy, o si no hay, el próximo, o si no, el último.
 */
export function bloqueVigente(disponibilidad) {
  if (disponibilidad.length === 0) return null;
  const hoy = hoyComoTexto();
  const ordenados = ordenarBloques(disponibilidad);
  return (
    ordenados.find((b) => aFecha(b.fecha_inicio) <= hoy && aFecha(b.fecha_termino) >= hoy) ??
    ordenados.find((b) => aFecha(b.fecha_inicio) > hoy) ??
    ordenados[ordenados.length - 1]
  );
}

/** "1 oct 2026 al 31 oct 2026" */
export function textoFechasBloque(bloque) {
  return `${formatearFecha(bloque.fecha_inicio)} al ${formatearFecha(bloque.fecha_termino)}`;
}

/** "09:00 a 18:00" */
export function textoHorarioBloque(bloque) {
  return `${aHora(bloque.hora_inicio)} a ${aHora(bloque.hora_termino)}`;
}

/** Período del bloque vigente, o "Sin período" */
export function textoPeriodo(disponibilidad) {
  const bloque = bloqueVigente(disponibilidad);
  return bloque ? textoFechasBloque(bloque) : 'Sin período';
}

/** Horario del bloque vigente, o un aviso si no hay bloques */
export function textoHorario(disponibilidad) {
  const bloque = bloqueVigente(disponibilidad);
  return bloque ? `Disponible de ${textoHorarioBloque(bloque)}` : 'Sin disponibilidad registrada';
}

/** Primer y último día del mes actual (para proponer fechas en el formulario) */
export function periodoMesActual() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const ultimoDia = new Date(anio, hoy.getMonth() + 1, 0).getDate();
  return { inicio: `${anio}-${mes}-01`, termino: `${anio}-${mes}-${ultimoDia}` };
}