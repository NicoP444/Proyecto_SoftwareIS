// Comisiones del evento: cuánto del precio acordado se lleva el personal y cuánto le queda al dueño.
//
// Decisión del equipo (validada con el Product Owner): el sistema NO bloquea la asignación
// cuando la comisión total es alta, porque la decisión final es del dueño. Solo AVISA:
//  - Sobre el TOPE_RECOMENDADO (40% personal / 60% dueño) -> aviso de comisión alta.
//  - Desde el TOPE_SIN_UTILIDAD (100%) -> aviso de que el dueño queda sin ganancia.
export const TOPE_RECOMENDADO = 40;
export const TOPE_SIN_UTILIDAD = 100;

// Los porcentajes se suman en centésimas (12.5% -> 1250) para evitar errores de decimales
const aCentesimas = (valor) => Math.round(Number(valor ?? 0) * 100);

// Nivel según el total de comisiones (en %)
export const nivelComision = (totalPorcentaje) => {
  if (totalPorcentaje >= TOPE_SIN_UTILIDAD) return "SIN_UTILIDAD";
  if (totalPorcentaje > TOPE_RECOMENDADO) return "ALTO";
  return "OK";
};

/**
 * Resume las comisiones de un evento.
 * asignaciones: [{ porcentaje, rol: { porcentaje_referencial } }]
 * Usa el porcentaje definido de la asignación o, si aún no hay, el referencial del rol
 * (igual que la viabilidad del evento). Un rol sin porcentaje cuenta como 0%.
 */
export const resumirComisiones = (asignaciones, precioAcordado = 0) => {
  const totalCent = asignaciones.reduce(
    (suma, a) =>
      suma + aCentesimas(a.porcentaje ?? a.rol?.porcentaje_referencial),
    0,
  );
  const total_porcentaje = totalCent / 100;
  const queda_dueno_porcentaje = (10000 - totalCent) / 100;

  return {
    precio_acordado: precioAcordado,
    total_porcentaje,
    queda_dueno_porcentaje,
    queda_dueno_monto: Math.round((precioAcordado * (10000 - totalCent)) / 10000),
    tope_recomendado: TOPE_RECOMENDADO,
    tope_sin_utilidad: TOPE_SIN_UTILIDAD,
    nivel: nivelComision(total_porcentaje),
    sin_porcentaje: asignaciones.filter(
      (a) => a.porcentaje == null && a.rol?.porcentaje_referencial == null,
    ).length,
  };
};

// Texto del aviso que se devuelve al asignar (null si está dentro de lo recomendado)
export const textoAvisoComision = (resumen) => {
  if (resumen.nivel === "SIN_UTILIDAD") {
    return `Las comisiones del evento suman ${resumen.total_porcentaje}%: el dueño queda sin utilidad (le queda ${resumen.queda_dueno_porcentaje}% del precio acordado)`;
  }
  if (resumen.nivel === "ALTO") {
    return `Las comisiones del evento suman ${resumen.total_porcentaje}%, sobre el ${resumen.tope_recomendado}% recomendado (al dueño le queda ${resumen.queda_dueno_porcentaje}%)`;
  }
  return null;
};