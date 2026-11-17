import prisma from '../config/prisma.js';
import { ValidationError } from '../utils/errores.js';
import { obtenerResumenFinancieroMensualService } from './resumenMensual.service.js';
import { obtenerKitsSinRetornoService } from './alertaKits.service.js';

const ESTADOS_ACTIVOS = ['PENDIENTE_ADELANTO', 'CONFIRMADO'];
const MS_DIA = 24 * 60 * 60 * 1000;
// Dueño: solo lo suyo. Contador y Jefe no tienen id_dueno en el token: ven lo de la empresa
const porDueno = (idDueno) => (idDueno ? { id_dueno: idDueno } : {});

// Hoy a las 00:00 (UTC), que es como se guardan las fechas de los eventos
const hoyUTC = () => {
  const ahora = new Date();
  return new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));
};

// Próximos eventos (desde hoy), con sus kits si se piden
const proximosEventos = (limite, conKits = false, idDueno) =>
  prisma.evento.findMany({
    where: { ...porDueno(idDueno), fecha: { gte: hoyUTC() }, estado: { in: ESTADOS_ACTIVOS } },
    select: {
      id_evento: true,
      tipo: true,
      fecha: true,
      hora_inicio: true,
      hora_termino: true,
      direccion: true,
      estado: true,
      cliente: { select: { nombre: true } },
      ...(conKits ? { reservas_kit: { select: { kit: { select: { nombre: true } } } } } : {}),
    },
    orderBy: [{ fecha: 'asc' }, { hora_inicio: 'asc' }],
    take: limite,
  });

// Acuerdo vencido = marcado VENCIDO, o sin cumplir y con la fecha comprometida ya pasada (RF-P4-05)
const filtroAcuerdosVencidos = (idDueno) => ({
  ...porDueno(idDueno),
  OR: [
    { estado: 'VENCIDO' },
    { estado: { in: ['PENDIENTE', 'PARCIAL'] }, fecha_comprometida: { lt: hoyUTC() } },
  ],
});

// ---------- Dueño: resultado del mes, próximos eventos y alertas ----------
async function panelDueno(idDueno) {
  const ahora = new Date();
  const hoy = hoyUTC();
  const hace7Dias = new Date(hoy.getTime() - 7 * MS_DIA);

  const [resumen, proximos, pendientesAdelanto, sinMarcar, acuerdosVencidos, incidentes, kitsSinRetorno] =
    await Promise.all([
      obtenerResumenFinancieroMensualService({ anio: ahora.getFullYear(), mes: ahora.getMonth() + 1 }),
      proximosEventos(5, false, idDueno),
      prisma.evento.count({
        where: { id_dueno: idDueno, estado: 'PENDIENTE_ADELANTO', fecha: { gte: hoy } },
      }),
      prisma.evento.count({ where: { id_dueno: idDueno, estado: 'CONFIRMADO', fecha: { lt: hoy } } }),
      prisma.acuerdoAuspicio.count({ where: filtroAcuerdosVencidos(idDueno) }),
      prisma.incidente.count({ where: { fecha: { gte: hace7Dias } } }),
      obtenerKitsSinRetornoService(),
    ]);

  const alertas = [
    { clave: 'adelanto', texto: 'Eventos pendientes de adelanto', cantidad: pendientesAdelanto, ruta: '/calendario' },
    { clave: 'sin_marcar', texto: 'Eventos pasados por marcar como realizados', cantidad: sinMarcar, ruta: '/marcar-evento' },
    { clave: 'acuerdos', texto: 'Acuerdos de auspicio vencidos', cantidad: acuerdosVencidos, ruta: '/auspiciadores' },
    { clave: 'kits', texto: 'Kits sin retorno hace más de 24 horas', cantidad: kitsSinRetorno.length, ruta: '/salida-kits' },
    { clave: 'incidentes', texto: 'Incidentes de la última semana', cantidad: incidentes, ruta: '/salida-kits?tab=incidentes' },
  ].filter((a) => a.cantidad > 0);

  return {
    rol: 'DUENO',
    resultado_mes: {
      anio: resumen.anio,
      mes: resumen.mes,
      utilidad_neta: resumen.utilidad_neta,
      resultado: resumen.resultado,
    },
    proximos_eventos: proximos,
    alertas,
  };
}

// ---------- Contador: rendiciones, saldos, remuneraciones y acuerdos vencidos ----------
async function panelContador() {
  const [rendicionesPendientes, eventos, porPagar, acuerdos] = await Promise.all([
    prisma.asignacionPersonal.count({
      where: {
        evento: { estado: 'REALIZADO' },
        OR: [{ estado_rendicion: 'PENDIENTE' }, { estado_rendicion: null }],
      },
    }),
    prisma.evento.findMany({
      where: { estado: { in: [...ESTADOS_ACTIVOS, 'REALIZADO'] } },
      select: {
        id_evento: true,
        tipo: true,
        fecha: true,
        precio_acordado: true,
        cliente: { select: { nombre: true } },
        pagos_cliente: { select: { monto: true } },
      },
    }),
    prisma.asignacionPersonal.aggregate({
      where: { estado_pago: 'POR_PAGAR', remuneracion: { gt: 0 } },
      _sum: { remuneracion: true },
      _count: { _all: true },
    }),
    prisma.acuerdoAuspicio.findMany({
      where: filtroAcuerdosVencidos(),
      select: {
        id_acuerdo: true,
        glosa: true,
        monto_comprometido: true,
        fecha_comprometida: true,
        auspiciador: { select: { nombre: true } },
      },
      orderBy: { fecha_comprometida: 'asc' },
    }),
  ]);

  // Saldo = precio acordado - pagos del cliente (solo los eventos que aún deben plata)
  const saldos = eventos
    .map((e) => ({
      id_evento: e.id_evento,
      tipo: e.tipo,
      fecha: e.fecha,
      cliente: e.cliente.nombre,
      saldo: e.precio_acordado - e.pagos_cliente.reduce((suma, p) => suma + p.monto, 0),
    }))
    .filter((e) => e.saldo > 0)
    .sort((a, b) => b.saldo - a.saldo);

  return {
    rol: 'CONTADOR',
    rendiciones_pendientes: rendicionesPendientes,
    saldos_por_cobrar: {
      total: saldos.reduce((suma, e) => suma + e.saldo, 0),
      cantidad: saldos.length,
      eventos: saldos.slice(0, 5),
    },
    remuneraciones_por_pagar: {
      total: porPagar._sum.remuneracion ?? 0,
      cantidad: porPagar._count._all,
    },
    acuerdos_vencidos: {
      cantidad: acuerdos.length,
      lista: acuerdos.slice(0, 5),
    },
  };
}

// ---------- Jefe técnico: próximos eventos con kits, kits en terreno y sin retorno ----------
async function panelJefe() {
  const [proximos, enTerreno, sinRetorno] = await Promise.all([
    proximosEventos(5, true),
    prisma.salidaKit.findMany({
      where: { fecha_hora_retorno: null },
      select: {
        id_salida: true,
        fecha_hora_salida: true,
        reserva: {
          select: {
            kit: { select: { nombre: true } },
            evento: { select: { tipo: true, fecha: true } },
          },
        },
        responsable: { select: { trabajador: { select: { nombre: true } } } },
      },
      orderBy: { fecha_hora_salida: 'asc' },
    }),
    obtenerKitsSinRetornoService(),
  ]);

  return {
    rol: 'JEFE_TECNICO',
    proximos_eventos: proximos,
    kits_en_terreno: enTerreno,
    kits_sin_retorno: sinRetorno.length,
  };
}

// RF-T-07: el panel de inicio cambia según el rol
export async function obtenerPanel(rol, idDueno) {
  if (rol === 'DUENO') return panelDueno(idDueno);
  if (rol === 'CONTADOR') return panelContador();
  if (rol === 'JEFE_TECNICO') return panelJefe();
  throw new ValidationError('El rol no es válido', 'rol');
}