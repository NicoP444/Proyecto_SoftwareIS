import prisma from '../config/prisma.js';

// Obtener salidas activas con kits que están actualmente en terreno
export const obtenerKitsEnTerrenoService = async () => {
  return await prisma.salidaKit.findMany({
    where: {
      reserva: {
        kit: {
          estado: 'EN_TERRENO',
        },
      },
    },
    include: {
      reserva: {
        include: {
          evento: true,
          kit: {
            include: {
              equipos: true,
            },
          },
        },
      },
      responsable: {
        include: {
          trabajador: true,
        },
      },
    },
    orderBy: {
      fecha_hora_salida: 'desc',
    },
  });
};

// Registrar la revisión de retorno (RF-P6-02) e incidente si aplica (RF-P6-03)
export const registrarRetornoService = async ({ id_salida, id_jefe, revisiones }) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Validar la salida
    const salida = await tx.salidaKit.findUnique({
      where: { id_salida: Number(id_salida) },
      include: {
        reserva: {
          include: {
            kit: { include: { equipos: true } },
            evento: true,
          },
        },
        responsable: true,
      },
    });

    if (!salida) {
      throw new Error('La salida especificada no existe.');
    }

    let hayIncidente = false;

    // 2. Procesar cada equipo revisado
    for (const rev of revisiones) {
      // Normalizar al enum EstadoRetorno: OPERATIVO | DANADO | PERDIDO | ROBADO
      let estadoRetornoNormalizado = rev.estado_retorno;
      if (['DANO', 'DANADO'].includes(rev.estado_retorno)) {
        estadoRetornoNormalizado = 'DANADO';
      } else if (['PERDIDA', 'PERDIDO'].includes(rev.estado_retorno)) {
        estadoRetornoNormalizado = 'PERDIDO';
      } else if (rev.estado_retorno === 'ROBO') {
        estadoRetornoNormalizado = 'ROBADO';
      }

      // Registrar en la tabla Revisa
      await tx.revisa.create({
        data: {
          id_salida: salida.id_salida,
          codigo: rev.codigo,
          estado_retorno: estadoRetornoNormalizado,
          observacion: rev.observacion || null,
        },
      });

      const esIncidente = ['DANADO', 'PERDIDO', 'ROBADO'].includes(estadoRetornoNormalizado);

      if (esIncidente) {
        hayIncidente = true;

        const equipo = await tx.equipo.findUnique({ where: { codigo: rev.codigo } });

        let valorIncidente = 0;
        if (estadoRetornoNormalizado === 'DANADO') {
          valorIncidente = Number(rev.costo_reparacion) || 0;
        } else {
          valorIncidente = equipo?.valor_compra || 0;
        }

        // Mapear al tipo de incidente según tu schema (DANO, PERDIDA, ROBO)
        let tipoIncidente = 'DANO';
        if (estadoRetornoNormalizado === 'PERDIDO') tipoIncidente = 'PERDIDA';
        if (estadoRetornoNormalizado === 'ROBADO') tipoIncidente = 'ROBO';

        // Crear registro en Incidente
        await tx.incidente.create({
          data: {
            tipo: tipoIncidente,
            fecha: new Date(),
            descripcion: rev.observacion || `Incidente reportado en retorno (${estadoRetornoNormalizado})`,
            valor: Math.round(valorIncidente),
            codigo: rev.codigo,
            id_evento: salida.reserva.id_evento,
            id_trabajador: salida.responsable.id_trabajador,
            id_jefe: Number(id_jefe) || salida.id_jefe || 1,
          },
        });

        // Actualizar estado del equipo (si se dañó queda NO_DISPONIBLE o DANADO según tu enum EstadoEquipo)
        await tx.equipo.update({
          where: { codigo: rev.codigo },
          data: {
            estado: estadoRetornoNormalizado === 'DANADO' ? 'DANADO' : 'DADO_DE_BAJA',
          },
        });
      } else {
        // OPERATIVO
        await tx.equipo.update({
          where: { codigo: rev.codigo },
          data: { estado: 'OPERATIVO' },
        });
      }
    }

    // 3. Postcondición del Kit
    const nuevoEstadoKit = hayIncidente ? 'INCOMPLETO' : 'DISPONIBLE';

    await tx.kit.update({
      where: { id_kit: salida.reserva.id_kit },
      data: { estado: nuevoEstadoKit },
    });

    return {
      mensaje: hayIncidente
        ? 'Retorno registrado con incidentes. El kit quedó INCOMPLETO y se generó el incidente.'
        : 'Retorno registrado con éxito. Todos los equipos operativos, kit DISPONIBLE.',
      estado_kit: nuevoEstadoKit,
    };
  });
};