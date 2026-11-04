import prisma from '../config/prisma.js';

export const acuerdoService = {
  // 1. Obtener todos los acuerdos con datos de auspiciador, evento y sus cumplimientos
  async obtenerTodos() {
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

  // 3. Registrar cumplimiento del aporte (RF-P4-04)
  async registrarCumplimiento(id_acuerdo, datos) {
    const { monto_recibido, fecha_recibida, id_contador } = datos;
    const acuerdoId = Number(id_acuerdo);

    // 1. Verificar si existe el acuerdo e incluir sus cumplimientos
    const acuerdo = await prisma.acuerdoAuspicio.findUnique({
      where: { id_acuerdo: acuerdoId },
      include: { cumplimientos: true },
    });

    if (!acuerdo) {
      throw new Error('El acuerdo de auspicio no existe.');
    }

    // 2. Resolver un id_contador válido
    let contadorId = Number(id_contador);

    if (!contadorId) {
      let contadorExistente = await prisma.contador.findFirst();

      // Si no existe ninguno, creamos el usuario base con todos los campos obligatorios
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

    // 3. Determinar el siguiente nro_cumplimiento secuencial (clave compuesta)
    const ultimoNumero = acuerdo.cumplimientos.reduce(
      (max, c) => (c.nro_cumplimiento > max ? c.nro_cumplimiento : max),
      0
    );
    const nuevoNumero = ultimoNumero + 1;

    // 4. Crear el registro en CumplimientoAporte
    await prisma.cumplimientoAporte.create({
      data: {
        id_acuerdo: acuerdoId,
        nro_cumplimiento: nuevoNumero,
        fecha: fecha_recibida ? new Date(fecha_recibida) : new Date(),
        monto_recibido: Number(monto_recibido),
        id_contador: contadorId,
      },
    });

    // 5. Calcular monto total acumulado recibido
    const totalRecibidoPrevio = acuerdo.cumplimientos.reduce(
      (acc, c) => acc + Number(c.monto_recibido || 0),
      0
    );
    const totalAcumulado = totalRecibidoPrevio + Number(monto_recibido);

    // 6. Regla RF-P4-04: CUMPLIDO si alcanza o supera lo comprometido, PARCIAL si es menor
    const nuevoEstado = totalAcumulado >= Number(acuerdo.monto_comprometido) ? 'CUMPLIDO' : 'PARCIAL';

    return await prisma.acuerdoAuspicio.update({
      where: { id_acuerdo: acuerdoId },
      data: {
        estado: nuevoEstado,
      },
      include: {
        cumplimientos: true,
        auspiciador: true,
      },
    });
  },
};