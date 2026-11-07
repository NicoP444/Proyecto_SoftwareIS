/**
 * Funciones pequeñas y constantes que usan varios componentes de Personal.
 * Los nombres de campos (id_trabajador, fecha_inicio, etc.) son los de Prisma.
 */

export const ESTADOS = [ // tenemos las constates de estado
  { valor: 'activo', texto: 'Activo' },
  { valor: 'licencia', texto: 'Con licencia' },
  { valor: 'inactivo', texto: 'Inactivo' },
];

// sirve para mostrar el estado en la tarjeta de trabajador, o en la lista de trabajadores
export function textoEstado(valor) {
  // buscamos el estado en la constante ESTADOS, con find, si no lo encontramos, devolvemos 'Sin estado'
  const estado = ESTADOS.find((e) => e.valor === valor);
  return estado ? estado.texto : 'Sin estado';
}

// sirve para mostrar el nombre completo del trabajador, si no tiene nombre, devolvemos una cadena vacía
export function nombreCompleto(trabajador) {
  // si no hay nada devolvemos '', trim para sacar espacios al principio y al final
  return (trabajador.nombre ?? '').trim();
}

// sirve para mostrar las iniciales del trabajador, si no tiene nombre, devolvemos una cadena vacía 
// y poner en mayúscula la primera letra de cada palabra
export function iniciales(nombre) {
  return nombre
    .split(' ') // cortamos el nombre en palabras
    .slice(0, 2) // tomamos las dos primeras palabras
    .map((parte) => parte.charAt(0).toUpperCase()) // tomamos la primera letra de cada palabra y la ponemos en mayúscula
    .join('');// unimos las letras y devolvemos las iniciales NP
} 

// sirve para mostrar los roles del trabajador, si no tiene roles, devolvemos un array vacío
export function rolesDe(trabajador) {
  return (trabajador.roles ?? trabajador.desempena ?? []).map((d) => d.rol).filter(Boolean);
}


export function aHora(valor) {
  if (!valor) return '';
  const texto = String(valor);
  return texto.includes('T') ? texto.slice(11, 16) : texto.slice(0, 5);// se trasforma en horas
}

// sirve para mostrar la fecha en formato "YYYY-MM-DD", si no tiene fecha, devolvemos una cadena vacía
export function aFecha(valor) { 
  return valor ? String(valor).slice(0, 10) : ''; // tomamos del 0 al 10 la letras
}

/** "2026-10-01" -> "1 oct 2026" */
export function formatearFecha(fecha) {
  if (!fecha) return '';
  const [anio, mes, dia] = aFecha(fecha).split('-').map(Number);// split para separar la fecha en año, mes y día y map para convertirlos a números
  // map para convertirlo a numeros
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ---------- Disponibilidad (bloques de fechas con horario) ----------

/** "2026-10-22" de hoy, para comparar con las fechas de los bloques */
function hoyComoTexto() {
  const hoy = new Date(); // creamos el objeto de fecha con la fecha actual
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');// mes actual y dos diguitos
  const dia = String(hoy.getDate()).padStart(2, '0');// dia actual y dos diguitos
  return `${hoy.getFullYear()}-${mes}-${dia}`;// devolvemos la fecha en formato YYYY-MM-DD
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

/** Primer y último día del mes actual (para proponer fechas en el formulario)  valores predeterminados*/
export function periodoMesActual() {
  const hoy = new Date(); // obtenemos la fecha actual
  const anio = hoy.getFullYear(); // obtenemos el año actual
  const mes = String(hoy.getMonth() + 1).padStart(2, '0'); // obtenemos el mes actual y lo formateamos con dos dígitos
  const ultimoDia = new Date(anio, hoy.getMonth() + 1, 0).getDate();// obtenemos el último día del mes actual
  return { inicio: `${anio}-${mes}-01`, termino: `${anio}-${mes}-${ultimoDia}` };// devolvemos un objeto con las fechas de inicio y término del mes actual
}