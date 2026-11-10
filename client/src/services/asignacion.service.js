import { pedir, obtenerUsuario } from './http.js';

// El back (validarDueno) pide id_dueno: es el id del usuario que inició sesión
const idDueno = () => obtenerUsuario()?.id;

// RF-P1-03: trabajadores libres para una fecha y horario (id_rol e id_evento son opcionales)
export function listarPersonalDisponible({ fecha, hora_inicio, hora_termino, id_rol, id_evento }) {
  const params = new URLSearchParams({ id_dueno: idDueno(), fecha, hora_inicio, hora_termino });
  if (id_rol) params.set('id_rol', id_rol);
  if (id_evento) params.set('id_evento', id_evento);
  return pedir(`/personal-disponible?${params}`);
}

// Trabajadores ya asignados a un evento
export const listarAsignaciones = (idEvento) => pedir(`/eventos/${idEvento}/asignaciones`);

// RF-P3-01: asigna un trabajador al evento con un rol
export const asignarTrabajador = (idEvento, idTrabajador, idRol) =>
  pedir(`/eventos/${idEvento}/asignaciones`, {
    method: 'POST',
    body: { id_trabajador: idTrabajador, id_rol: idRol, id_dueno: idDueno() },
  });

// Quita a un trabajador del evento
export const quitarAsignacion = (idEvento, idAsignacion) =>
  pedir(`/eventos/${idEvento}/asignaciones/${idAsignacion}`, { method: 'DELETE' });