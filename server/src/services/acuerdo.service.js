import prisma from '../config/prisma.js';

// Convierte "YYYY-MM-DD" a Date local a mediodía para evitar desfases de zona horaria
const parsearFechaSegura = (fechaStr) => {
  if (!fechaStr) return new Date();
  const str = String(fechaStr).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return new Date(`${str.slice(0, 10)}T12:00:00`);
  }
  return new Date(str);
};

const obtenerFechaHoyStr = () => {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

export const acuerdoService = {
  // 1. Obtener todos los acuerdos y actualizar vencidos automáticamente (RF-P4-05)
  async obtenerTodos() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Normaliza cualquier registro antiguo en estado PARCIAL a CUMPLIDO
    await prisma.acuerdoAuspicio.updateMany({
      where: {
        estado: 'PARCIAL',
      },
      data: {
        estado: 'CUMPLIDO',
      },
    });

    await prisma.acuerdoAuspicio.updateMany({
      where: {
        fecha_comprometida: {
          lt: hoy,
        },
        estado: 'PENDIENTE',
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
      tipo_pago,
      monto_comprometido,
      monto,
      descripcion_canje,
      cant_menciones,
      fecha_comprometida,
      fecha_limite,
      id_auspiciador,
      id_evento,
      id_dueno,
    } = datos;

    const eventoAsociado = await prisma.evento.findUnique({
      where: { id_evento: Number(id_evento) },
    });

    if (!eventoAsociado) {
      throw new Error('El evento seleccionado no existe.');
    }

    if (eventoAsociado.estado === 'CERRADO' || eventoAsociado.estado === 'REALIZADO') {
      throw new Error('No se pueden registrar acuerdos en un evento ya realizado o cerrado.');
    }

    const fechaEventoStr = eventoAsociado.fecha
      ? new Date(eventoAsociado.fecha).toISOString().slice(0, 10)
      : '';
    const hoyStr = obtenerFechaHoyStr();

    if (!fechaEventoStr || fechaEventoStr < hoyStr) {
      throw new Error('Solo se pueden registrar acuerdos para eventos de hoy o fechas futuras.');
    }

    // Verifica que el id_dueno recibido exista realmente en la tabla Dueno
    let duenoId = Number(id_dueno);
    let duenoValido = null;

    if (duenoId && !Number.isNaN(duenoId)) {
      duenoValido = await prisma.dueno.findUnique({
        where: { id_dueno: duenoId },
      });
    }

    if (!duenoValido) {
      const primerDueno = await prisma.dueno.findFirst();
      duenoId = primerDueno ? primerDueno.id_dueno : 1;
    }

    const fechaFinal = fecha_comprometida || fecha_limite;
    const montoFinal = monto_comprometido ?? monto;
    const tipoFinal = tipo_aporte || tipo_pago || 'DINERO';

    return await prisma.acuerdoAuspicio.create({
      data: {
        glosa: glosa.trim(),
        tipo_aporte: tipoFinal,
        monto_comprometido: Number(montoFinal),
        descripcion_canje: descripcion_canje ? descripcion_canje.trim() : null,
        cant_menciones: cant_menciones !== null && cant_menciones !== undefined && cant_menciones !== ''
          ? Number(cant_menciones)
          : null,
        fecha_comprometida: parsearFechaSegura(fechaFinal),
        estado: 'PENDIENTE',
        id_auspiciador: Number(id_auspiciador),
        id_evento: Number(id_evento),
        id_dueno: duenoId,
      },
    });
  },

  // 3. Registrar cumplimiento del aporte por pago completo (RF-P4-04)
  async registrarCumplimiento(id_acuerdo, datos) {
    const { monto_recibido, fecha_recibida, fecha, id_contador } = datos;
    const acuerdoId = Number(id_acuerdo);

    const acuerdo = await prisma.acuerdoAuspicio.findUnique({
      where: { id_acuerdo: acuerdoId },
      include: { cumplimientos: true },
    });

    if (!acuerdo) {
      throw new Error('El acuerdo de auspicio no existe.');
    }

    if (acuerdo.estado === 'INCOBRABLE') {
      throw new Error('No se pueden registrar pagos en un acuerdo declarado como incobrable.');
    }

    const valorRecibido = Number(monto_recibido);

    if (Number.isNaN(valorRecibido) || valorRecibido < 0) {
      throw new Error('El monto recibido no puede ser negativo.');
    }

    // Caso de anulación / restablecimiento (únicamente cuando se ingresa 0)
    if (valorRecibido === 0) {
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

    // Resolver usuario contador válido en la tabla Contador
    let contadorId = Number(id_contador);
    let contadorValido = null;

    if (contadorId && !Number.isNaN(contadorId)) {
      contadorValido = await prisma.contador.findUnique({
        where: { id_contador: contadorId },
      });
    }

    if (!contadorValido) {
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

    // Reemplaza registros previos para asegurar un único pago completo igual al monto comprometido
    await prisma.cumplimientoAporte.deleteMany({
      where: { id_acuerdo: acuerdoId },
    });

    const fechaRecepcionFinal = fecha_recibida || fecha;

    await prisma.cumplimientoAporte.create({
      data: {
        id_acuerdo: acuerdoId,
        nro_cumplimiento: 1,
        fecha: fechaRecepcionFinal ? parsearFechaSegura(fechaRecepcionFinal) : new Date(),
        monto_recibido: Number(acuerdo.monto_comprometido),
        id_contador: contadorId,
      },
    });

    return await prisma.acuerdoAuspicio.update({
      where: { id_acuerdo: acuerdoId },
      data: { estado: 'CUMPLIDO' },
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
      fecha_limite,
      id_evento,
    } = datos;

    const acuerdoExistente = await prisma.acuerdoAuspicio.findUnique({
      where: { id_acuerdo: acuerdoId },
      include: { cumplimientos: true },
    });

    if (!acuerdoExistente) {
      throw new Error('El acuerdo de auspicio no existe.');
    }

    const fechaFinal = fecha_comprometida || fecha_limite;
    let nuevoEstado = acuerdoExistente.estado;
    const nuevoMonto = monto_comprometido !== undefined ? Number(monto_comprometido) : Number(acuerdoExistente.monto_comprometido);
    const nuevaFecha = fechaFinal ? parsearFechaSegura(fechaFinal) : new Date(acuerdoExistente.fecha_comprometida);

    const tienePagoRegistrado = (acuerdoExistente.cumplimientos || []).length > 0;

    if (acuerdoExistente.estado !== 'INCOBRABLE') {
      if (tienePagoRegistrado) {
        nuevoEstado = 'CUMPLIDO';
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
        glosa: glosa !== undefined ? glosa.trim() : acuerdoExistente.glosa,
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

  // 6. Eliminar acuerdo
  async eliminar(id_acuerdo) {
    const acuerdoId = Number(id_acuerdo);

    const acuerdoExistente = await prisma.acuerdoAuspicio.findUnique({
      where: { id_acuerdo: acuerdoId },
    });

    if (!acuerdoExistente) {
      throw new Error('El acuerdo de auspicio no existe.');
    }

    await prisma.cumplimientoAporte.deleteMany({
      where: { id_acuerdo: acuerdoId },
    });

    return await prisma.acuerdoAuspicio.delete({
      where: { id_acuerdo: acuerdoId },
    });
  },
};