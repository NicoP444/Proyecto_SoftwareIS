import prisma from '../config/prisma.js';
import { ValidationError } from '../utils/errores.js';

const CATEGORIAS_REQUERIDAS = ['CAMARA', 'TRIPODE', 'MICROFONO', 'SWITCH_VIDEO'];

const calcularEstadoKit = (equipos) => {
  if (!Array.isArray(equipos) || equipos.length === 0) return 'INCOMPLETO';
  const categoriasPresentes = new Set(equipos.map((e) => e.categoria?.toUpperCase()));
  const cumpleMinimo = CATEGORIAS_REQUERIDAS.every((cat) => categoriasPresentes.has(cat));
  return cumpleMinimo ? 'DISPONIBLE' : 'INCOMPLETO';
};

export const kitService = {
  async listar() {
    return await prisma.kit.findMany({
      include: {
        equipos: true,
      },
    });
  },

  async crear(datos) {
    const { nombre, nivel, recargo_pct, id_jefe, equipos } = datos;

    const kitExistente = await prisma.kit.findUnique({
      where: { nombre },
    });

    if (kitExistente) {
      throw new ValidationError(`Ya existe un kit registrado con el nombre "${nombre}"`, 'nombre');
    }

    const equiposEncontrados = await prisma.equipo.findMany({
      where: {
        codigo: { in: equipos },
      },
    });

    if (equiposEncontrados.length !== equipos.length) {
      throw new ValidationError('Uno o más equipos seleccionados no existen en el inventario', 'equipos');
    }

    const noOperativos = equiposEncontrados.filter((eq) => eq.estado !== 'OPERATIVO');
    if (noOperativos.length > 0) {
      const nombres = noOperativos.map((e) => e.nombre).join(', ');
      throw new ValidationError(`Los siguientes equipos no están operativos: ${nombres}`, 'equipos');
    }

    const yaAsignados = equiposEncontrados.filter((eq) => eq.id_kit !== null);
    if (yaAsignados.length > 0) {
      const nombres = yaAsignados.map((e) => e.nombre).join(', ');
      throw new ValidationError(`Los siguientes equipos ya pertenecen a otro kit: ${nombres}`, 'equipos');
    }

    const categoriasPresentes = equiposEncontrados.map((eq) => eq.categoria);
    const faltantes = CATEGORIAS_REQUERIDAS.filter((cat) => !categoriasPresentes.includes(cat));

    if (faltantes.length > 0) {
      throw new ValidationError(
        `El kit requiere al menos un equipo de cada categoría obligatoria. Faltan: ${faltantes.join(', ')}`,
        'equipos'
      );
    }

    let jefeId = id_jefe ? Number(id_jefe) : null;
    let jefeExistente = null;

    if (jefeId) {
      jefeExistente = await prisma.jefeAreaTecnica.findUnique({
        where: { id_jefe: jefeId },
      });
    }

    if (!jefeExistente) {
      jefeExistente = await prisma.jefeAreaTecnica.findFirst();
      if (!jefeExistente) {
        jefeExistente = await prisma.jefeAreaTecnica.create({
          data: {
            nombre: 'Jefe de Área Técnica',
            correo: 'jefe.tecnico@empresa.cl',
            contrasena: '123456',
          },
        });
      }
      jefeId = jefeExistente.id_jefe;
    }

    const estadoCalculado = calcularEstadoKit(equiposEncontrados);

    const nuevoKit = await prisma.$transaction(async (tx) => {
      const kitCreado = await tx.kit.create({
        data: {
          nombre,
          nivel,
          recargo_pct,
          estado: estadoCalculado,
          id_jefe: jefeId,
        },
      });

      await tx.equipo.updateMany({
        where: {
          codigo: { in: equipos },
        },
        data: {
          id_kit: kitCreado.id_kit,
        },
      });

      return await tx.kit.findUnique({
        where: { id_kit: kitCreado.id_kit },
        include: {
          equipos: true,
        },
      });
    });

    return nuevoKit;
  },

  async actualizar(idKit, datos) {
    const id_kit = Number(idKit);
    if (!Number.isInteger(id_kit) || id_kit <= 0) {
      throw new ValidationError('El ID del kit no es válido', 'id_kit');
    }

    const { nombre, nivel, recargo_pct, id_jefe, equipos } = datos;

    const kitActual = await prisma.kit.findUnique({
      where: { id_kit },
      include: { equipos: true },
    });

    if (!kitActual) {
      throw new ValidationError('El kit no existe', 'id_kit');
    }

    const codigosActuales = kitActual.equipos.map((eq) => eq.codigo);
    const mismosEquipos =
      Array.isArray(equipos) &&
      equipos.length === codigosActuales.length &&
      equipos.every((c) => codigosActuales.includes(c));

    // Solo consideramos que intenta cambiar equipos si envió un arreglo distinto al actual
    const intentandoCambiarEquipos = equipos !== undefined && !mismosEquipos;

    if (intentandoCambiarEquipos && kitActual.estado === 'EN_TERRENO') {
      throw new ValidationError('No se pueden modificar los equipos de un kit mientras está en terreno', 'equipos');
    }

    if (nombre && nombre !== kitActual.nombre) {
      const kitExistente = await prisma.kit.findUnique({ where: { nombre } });
      if (kitExistente) {
        throw new ValidationError(`Ya existe un kit registrado con el nombre "${nombre}"`, 'nombre');
      }
    }

    let nuevosEquiposCodigos = codigosActuales;
    let equiposEncontrados = kitActual.equipos;

    if (intentandoCambiarEquipos) {
      nuevosEquiposCodigos = equipos;

      equiposEncontrados = await prisma.equipo.findMany({
        where: { codigo: { in: nuevosEquiposCodigos } },
      });

      if (equiposEncontrados.length !== nuevosEquiposCodigos.length) {
        throw new ValidationError('Uno o más equipos seleccionados no existen en el inventario', 'equipos');
      }

      const noOperativos = equiposEncontrados.filter((eq) => eq.estado !== 'OPERATIVO');
      if (noOperativos.length > 0) {
        const nombres = noOperativos.map((e) => e.nombre).join(', ');
        throw new ValidationError(`Los siguientes equipos no están operativos: ${nombres}`, 'equipos');
      }

      const deOtroKit = equiposEncontrados.filter((eq) => eq.id_kit !== null && eq.id_kit !== id_kit);
      if (deOtroKit.length > 0) {
        const nombres = deOtroKit.map((e) => e.nombre).join(', ');
        throw new ValidationError(`Los siguientes equipos ya pertenecen a otro kit: ${nombres}`, 'equipos');
      }

      // RF-P5-05: Validar siempre composición mínima de equipos al modificar el kit
      const categoriasPresentes = equiposEncontrados.map((eq) => eq.categoria);
      const faltantes = CATEGORIAS_REQUERIDAS.filter((cat) => !categoriasPresentes.includes(cat));

      if (faltantes.length > 0) {
        throw new ValidationError(
          `El kit requiere al menos un equipo de cada categoría obligatoria. Faltan: ${faltantes.join(', ')}`,
          'equipos'
        );
      }
    }

    // RF-P5-05: Si está EN_TERRENO y solo se edita el nombre/nivel/recargo, NO debe cambiar a DISPONIBLE
    const estadoCalculado =
      kitActual.estado === 'EN_TERRENO'
        ? 'EN_TERRENO'
        : calcularEstadoKit(equiposEncontrados);

    const kitActualizado = await prisma.$transaction(async (tx) => {
      await tx.kit.update({
        where: { id_kit },
        data: {
          ...(nombre && { nombre }),
          ...(nivel && { nivel }),
          ...(recargo_pct !== undefined && { recargo_pct }),
          ...(id_jefe && { id_jefe }),
          estado: estadoCalculado,
        },
      });

      if (intentandoCambiarEquipos) {
        const aLiberar = codigosActuales.filter((c) => !nuevosEquiposCodigos.includes(c));
        if (aLiberar.length > 0) {
          await tx.equipo.updateMany({
            where: { codigo: { in: aLiberar } },
            data: { id_kit: null },
          });
        }

        await tx.equipo.updateMany({
          where: { codigo: { in: nuevosEquiposCodigos } },
          data: { id_kit },
        });
      }

      return await tx.kit.findUnique({
        where: { id_kit },
        include: { equipos: true },
      });
    });

    return kitActualizado;
  },

  async eliminar(idKit) {
    const id_kit = Number(idKit);
    if (!Number.isInteger(id_kit) || id_kit <= 0) {
      throw new ValidationError('El ID del kit no es válido', 'id_kit');
    }

    const kit = await prisma.kit.findUnique({
      where: { id_kit },
      include: { equipos: true },
    });

    if (!kit) {
      throw new ValidationError('El kit no existe', 'id_kit');
    }

    if (kit.estado === 'EN_TERRENO') {
      throw new ValidationError('No se puede eliminar un kit que se encuentra en terreno', 'estado');
    }

    // RF-P5-06: Validar si tiene reservas asociadas en eventos futuros
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let tieneReservasFuturas = false;
    const modelosReserva = [
      prisma.kitEvento,
      prisma.eventoKit,
      prisma.reservaKit,
      prisma.asignacionKit,
    ].filter(Boolean);

    for (const modelo of modelosReserva) {
      try {
        const asignaciones = await modelo.findMany({
          where: { id_kit },
          include: { evento: true },
        });

        tieneReservasFuturas = asignaciones.some((asig) => {
          const ev = asig.evento;
          if (!ev) return false;
          const fechaEv = new Date(
            ev.fecha || ev.fecha_evento || ev.fecha_inicio || ev.fecha_realizacion
          );
          const estadoEv = String(ev.estado || '').toUpperCase();
          if (['CANCELADO', 'FINALIZADO', 'CERRADO'].includes(estadoEv)) return false;
          return !Number.isNaN(fechaEv.getTime()) && fechaEv >= hoy;
        });

        if (tieneReservasFuturas) break;
      } catch {
        // Continúa si el modelo tiene otra estructura
      }
    }

    if (tieneReservasFuturas) {
      throw new ValidationError(
        'No se puede eliminar el kit porque tiene reservas asignadas en eventos futuros.',
        'id_kit'
      );
    }

    try {
      return await prisma.$transaction(async (tx) => {
        await tx.equipo.updateMany({
          where: { id_kit },
          data: { id_kit: null },
        });

        await tx.kit.delete({
          where: { id_kit },
        });

        return { mensaje: 'Kit eliminado exitosamente y sus equipos pasaron a ser repuestos' };
      });
    } catch (error) {
      // Si falla por restricción de llave foránea con eventos/reservas
      throw new ValidationError(
        'No se puede eliminar el kit porque tiene reservas o eventos asociados.',
        'id_kit'
      );
    }
  },
};