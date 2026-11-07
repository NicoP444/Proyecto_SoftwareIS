import prisma from '../config/prisma.js';

export const acuerdoService = {
  // 1. Obtener todos los acuerdos y actualizar vencidos automáticamente (RF-P4-05)
  async obtenerTodos() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Regla RF-P4-05: Todo acuerdo con fecha comprometida menor a hoy que siga PENDIENTE o PARCIAL pasa a VENCIDO
    await prisma.acuerdoAuspicio.updateMany({
      where: {
        fecha_comprometida: {
          lt: hoy,
        },
        estado: {
          in: ['PENDIENTE', 'PARCIAL'],
        },
      },
      data: {
        estado: 'VENCIDO',
      },
    });

    return await prisma.acuerdoAuspicio.findMany({
      include: {
        auspiciador: true,
        evento: true,
        cumplimientos: true,
      },
      orderBy: {
        id_acuerdo: 'desc',
      },
    });
  },

  // 2. Registrar acuerdo (RF-P4-02)
  async crear(datos) {
    const {
      glosa,
      tipo_aporte,
      monto_comprometido,
      descripcion_canje,
      cant_menciones,
      fecha_comprometida,
      id_auspiciador,
      id_evento,
      id_dueno,
    } = datos;

    return await prisma.acuerdoAuspicio.create({
      data: {
        glosa,
        tipo_aporte,
        monto_comprometido: Number(monto_comprometido),
        descripcion_canje: descripcion_canje || null,
        cant_menciones: cant_menciones ? Number(cant_menciones) : null,
        fecha_comprometida: new Date(fecha_comprometida),
        estado: 'PENDIENTE',
        id_auspiciador: Number(id_auspiciador),
        id_evento: Number(id_evento),
        id_dueno: Number(id_dueno || 1),
      },
    });
  },

  // 3. Registrar o corregir cumplimiento del aporte (RF-P4-04)
  async registrarCumplimiento(id_acuerdo, datos) {
    const { monto_recibido, fecha_recibida, id_contador } = datos;
    const acuerdoId = Number(id_acuerdo);

    const acuerdo = await prisma.acuerdoAuspicio.findUnique({
      where: { id_acuerdo: acuerdoId },
      include: { cumplimientos: true },
    });

    if (!acuerdo) {
      throw new Error('El acuerdo de auspicio no existe.');
    }

    const valorRecibido = Number(monto_recibido);

    // Caso de anulación / corrección (monto 0 o menor)
    if (valorRecibido <= 0) {
      await prisma.cumplimientoAporte.deleteMany({
        where: { id_acuerdo: acuerdoId },
      });

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaLimite = new Date(acuerdo.fecha_comprometida);
      fechaLimite.setHours(0, 0, 0, 0);

      const estadoRestablecido = hoy > fechaLimite ? 'VENCIDO' : 'PENDIENTE';

      return await prisma.acuerdoAuspicio.update({
        where: { id_acuerdo: acuerdoId },
        data: { estado: estadoRestablecido },
        include: { cumplimientos: true, auspiciador: true },
      });
    }

    // Resolver usuario contador para la llave foránea
    let contadorId = Number(id_contador);
    if (!contadorId) {
      let contadorExistente = await prisma.contador.findFirst();
      if (!contadorExistente) {
        contadorExistente = await prisma.contador.create({
          data: {
            nombre: 'Contador General',
            correo: 'contador@empresa.cl',
            contrasena: '123456',
          },
        });
      }
      contadorId = contadorExistente.id_contador;
    }

    // Calcular siguiente nro_cumplimiento (clave primaria compuesta)
    const ultimoNumero = acuerdo.cumplimientos.reduce(
      (max, c) => (c.nro_cumplimiento > max ? c.nro_cumplimiento : max),
      0
    );
    const nuevoNumero = ultimoNumero + 1;

    // Crear registro en tabla CumplimientoAporte
    await prisma.cumplimientoAporte.create({
      data: {
        id_acuerdo: acuerdoId,
        nro_cumplimiento: nuevoNumero,
        fecha: fecha_recibida ? new Date(fecha_recibida) : new Date(),
        monto_recibido: valorRecibido,
        id_contador: contadorId,
      },
    });

    // Calcular acumulado
    const totalRecibidoPrevio = acuerdo.cumplimientos.reduce(
      (acc, c) => acc + Number(c.monto_recibido || 0),
      0
    );
    const totalAcumulado = totalRecibidoPrevio + valorRecibido;

    // Actualizar estado del acuerdo
    const nuevoEstado = totalAcumulado >= Number(acuerdo.monto_comprometido) ? 'CUMPLIDO' : 'PARCIAL';

    return await prisma.acuerdoAuspicio.update({
      where: { id_acuerdo: acuerdoId },
      data: { estado: nuevoEstado },
      include: { cumplimientos: true, auspiciador: true },
    });
  },

  // 4. Declarar acuerdo como incobrable (RF-P4-06)
  async declararIncobrable(id_acuerdo, motivo_incobrable) {
    const acuerdoId = Number(id_acuerdo);

    const acuerdo = await prisma.acuerdoAuspicio.findUnique({
      where: { id_acuerdo: acuerdoId },
    });

    if (!acuerdo) {
      throw new Error('El acuerdo no existe.');
    }

    // Validación según RF-P4-06: solo acuerdos vencidos pueden pasar a incobrables
    if (acuerdo.estado !== 'VENCIDO') {
      throw new Error('Solo los acuerdos con estado VENCIDO pueden declararse como incobrables.');
    }

    if (!motivo_incobrable || !motivo_incobrable.trim()) {
      throw new Error('Debe indicar un motivo para declarar el aporte como incobrable.');
    }

    return await prisma.acuerdoAuspicio.update({
      where: { id_acuerdo: acuerdoId },
      data: {
        estado: 'INCOBRABLE',
        motivo_incobrable: motivo_incobrable.trim(),
      },
      include: {
        auspiciador: true,
        evento: true,
        cumplimientos: true,
      },
    });
  },

  // 5. Modificar acuerdo existente
  async modificar(id_acuerdo, datos) {
    const acuerdoId = Number(id_acuerdo);
    const {
      glosa,
      tipo_aporte,
      monto_comprometido,
      descripcion_canje,
      cant_menciones,
      fecha_comprometida,
      id_evento,
    } = datos;

    const acuerdoExistente = await prisma.acuerdoAuspicio.findUnique({
      where: { id_acuerdo: acuerdoId },
      include: { cumplimientos: true },
    });

    if (!acuerdoExistente) {
      throw new Error('El acuerdo de auspicio no existe.');
    }

    // Recalcular estado si se cambia la fecha o el monto
    let nuevoEstado = acuerdoExistente.estado;
    const nuevoMonto = monto_comprometido !== undefined ? Number(monto_comprometido) : Number(acuerdoExistente.monto_comprometido);
    const nuevaFecha = fecha_comprometida ? new Date(fecha_comprometida) : new Date(acuerdoExistente.fecha_comprometida);

    const totalPagado = (acuerdoExistente.cumplimientos || []).reduce(
      (acc, c) => acc + Number(c.monto_recibido || 0),
      0
    );

    if (acuerdoExistente.estado !== 'INCOBRABLE') {
      if (totalPagado >= nuevoMonto && nuevoMonto > 0) {
        nuevoEstado = 'CUMPLIDO';
      } else if (totalPagado > 0) {
        nuevoEstado = 'PARCIAL';
      } else {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaLimite = new Date(nuevaFecha);
        fechaLimite.setHours(0, 0, 0, 0);

        nuevoEstado = hoy > fechaLimite ? 'VENCIDO' : 'PENDIENTE';
      }
    }

    return await prisma.acuerdoAuspicio.update({
      where: { id_acuerdo: acuerdoId },
      data: {
        glosa: glosa !== undefined ? glosa : acuerdoExistente.glosa,
        tipo_aporte: tipo_aporte || acuerdoExistente.tipo_aporte,
        monto_comprometido: nuevoMonto,
        descripcion_canje: descripcion_canje !== undefined ? descripcion_canje : acuerdoExistente.descripcion_canje,
        cant_menciones: cant_menciones !== undefined ? (cant_menciones ? Number(cant_menciones) : null) : acuerdoExistente.cant_menciones,
        fecha_comprometida: nuevaFecha,
        id_evento: id_evento ? Number(id_evento) : acuerdoExistente.id_evento,
        estado: nuevoEstado,
      },
      include: {
        auspiciador: true,
        evento: true,
        cumplimientos: true,
      },
    });
  },

  // 6. Eliminar acuerdo (borra cumplimientos asociados primero)
  async eliminar(id_acuerdo) {
    const acuerdoId = Number(id_acuerdo);

    const acuerdoExistente = await prisma.acuerdoAuspicio.findUnique({
      where: { id_acuerdo: acuerdoId },
    });

    if (!acuerdoExistente) {
      throw new Error('El acuerdo de auspicio no existe.');
    }

    // Borrar aportes asociados primero para respetar clave foránea
    await prisma.cumplimientoAporte.deleteMany({
      where: { id_acuerdo: acuerdoId },
    });

    return await prisma.acuerdoAuspicio.delete({
      where: { id_acuerdo: acuerdoId },
    });
  },
};