import prisma from '../config/prisma.js';
import { ValidationError } from '../utils/errores.js';

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
    const categoriasRequeridas = ['CAMARA', 'TRIPODE', 'MICROFONO', 'SWITCH_VIDEO'];
    const faltantes = categoriasRequeridas.filter((cat) => !categoriasPresentes.includes(cat));

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

    const nuevoKit = await prisma.$transaction(async (tx) => {
      const kitCreado = await tx.kit.create({
        data: {
          nombre,
          nivel,
          recargo_pct,
          estado: 'DISPONIBLE',
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

    const intentandoCambiarEquipos = equipos !== undefined;

    // Regla: Impidiendo cambios de composición mientras esté en terreno
    if (intentandoCambiarEquipos && kitActual.estado === 'EN_TERRENO') {
      throw new ValidationError('No se pueden modificar los equipos de un kit mientras está en terreno', 'equipos');
    }

    if (nombre && nombre !== kitActual.nombre) {
      const kitExistente = await prisma.kit.findUnique({ where: { nombre } });
      if (kitExistente) {
        throw new ValidationError(`Ya existe un kit registrado con el nombre "${nombre}"`, 'nombre');
      }
    }

    let nuevosEquiposCodigos = kitActual.equipos.map((eq) => eq.codigo);

    if (intentandoCambiarEquipos) {
      nuevosEquiposCodigos = equipos;

      const equiposEncontrados = await prisma.equipo.findMany({
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

      // Permitir si ya pertenecen a este kit o no pertenecen a ningún kit
      const deOtroKit = equiposEncontrados.filter((eq) => eq.id_kit !== null && eq.id_kit !== id_kit);
      if (deOtroKit.length > 0) {
        const nombres = deOtroKit.map((e) => e.nombre).join(', ');
        throw new ValidationError(`Los siguientes equipos ya pertenecen a otro kit: ${nombres}`, 'equipos');
      }

      const categoriasPresentes = equiposEncontrados.map((eq) => eq.categoria);
      const categoriasRequeridas = ['CAMARA', 'TRIPODE', 'MICROFONO', 'SWITCH_VIDEO'];
      const faltantes = categoriasRequeridas.filter((cat) => !categoriasPresentes.includes(cat));

      if (faltantes.length > 0) {
        throw new ValidationError(
          `El kit requiere al menos un equipo de cada categoría obligatoria. Faltan: ${faltantes.join(', ')}`,
          'equipos'
        );
      }
    }

    const kitActualizado = await prisma.$transaction(async (tx) => {
      const kitModificado = await tx.kit.update({
        where: { id_kit },
        data: {
          ...(nombre && { nombre }),
          ...(nivel && { nivel }),
          ...(recargo_pct !== undefined && { recargo_pct }),
          ...(id_jefe && { id_jefe }),
        },
      });

      if (intentandoCambiarEquipos) {
        const codigosActuales = kitActual.equipos.map((eq) => eq.codigo);

        // Liberar equipos que ya no están
        const aLiberar = codigosActuales.filter((c) => !nuevosEquiposCodigos.includes(c));
        if (aLiberar.length > 0) {
          await tx.equipo.updateMany({
            where: { codigo: { in: aLiberar } },
            data: { id_kit: null },
          });
        }

        // Asignar nuevos equipos
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
};