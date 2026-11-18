import prisma from '../config/prisma.js';

// Evita que la fecha "YYYY-MM-DD" retroceda un día por la zona horaria de Chile
const parsearFechaSegura = (fechaStr) => {
  if (!fechaStr) return new Date();
  const limpia = String(fechaStr).slice(0, 10);
  return new Date(`${limpia}T12:00:00`);
};

export const equipoService = {
  async obtenerTodos() {
    return await prisma.equipo.findMany({
      include: {
        kit: true,
        jefe: true,
      },
      orderBy: {
        fecha_compra: 'desc',
      },
    });
  },

  async crear(datos) {
    const {
      nombre,
      categoria,
      marca,
      modelo,
      fecha_compra,
      valor_compra,
      id_jefe,
    } = datos;

    if (!nombre || !categoria || !fecha_compra || valor_compra === undefined) {
      throw new Error('Faltan campos obligatorios: nombre, categoría, fecha de compra o valor.');
    }

    const valorNum = Math.round(Number(valor_compra));
    if (Number.isNaN(valorNum) || valorNum <= 0) {
      throw new Error('El valor de compra debe ser un número mayor a 0.');
    }

    // 1. Obtener un id_jefe válido existente en la base de datos
    let jefeId = Number(id_jefe);
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

    // 2. Prefijo según categoría
    const prefijos = {
      CAMARA: 'CAM',
      TRIPODE: 'TRI',
      MICROFONO: 'MIC',
      SWITCH_VIDEO: 'SWV',
      OTRO: 'EQP',
    };
    const prefijo = prefijos[categoria] || 'EQP';

    // 3. Generar correlativo único
    const totalExistentes = await prisma.equipo.count({
      where: { categoria },
    });

    let correlativoNum = totalExistentes + 1;
    let codigoGenerado = `${prefijo}-${String(correlativoNum).padStart(3, '0')}`;

    while (await prisma.equipo.findUnique({ where: { codigo: codigoGenerado } })) {
      correlativoNum++;
      codigoGenerado = `${prefijo}-${String(correlativoNum).padStart(3, '0')}`;
    }

    // 4. Formatear fecha segura para @db.Date
    const fechaObj = parsearFechaSegura(fecha_compra);

    // 5. Inserción
    return await prisma.equipo.create({
      data: {
        codigo: codigoGenerado,
        nombre: nombre.trim(),
        categoria,
        marca: marca ? marca.trim() : null,
        modelo: modelo ? modelo.trim() : null,
        fecha_compra: fechaObj,
        valor_compra: valorNum,
        estado: 'OPERATIVO',
        id_kit: null,
        id_evento_repuesto: null,
        id_jefe: jefeId,
      },
      include: {
        kit: true,
        jefe: true,
      },
    });
  },

  async actualizar(codigo, datos) {
    const {
      nombre,
      marca,
      modelo,
      fecha_compra,
      valor_compra,
    } = datos;

    const equipoExistente = await prisma.equipo.findUnique({
      where: { codigo },
    });

    if (!equipoExistente) {
      throw new Error(`El equipo con código ${codigo} no existe.`);
    }

    const dataActualizada = {};
    if (nombre !== undefined && nombre.trim() !== '') {
      dataActualizada.nombre = nombre.trim();
    }
    if (marca !== undefined) {
      dataActualizada.marca = marca ? marca.trim() : null;
    }
    if (modelo !== undefined) {
      dataActualizada.modelo = modelo ? modelo.trim() : null;
    }
    if (fecha_compra) {
      dataActualizada.fecha_compra = parsearFechaSegura(fecha_compra);
    }
    if (valor_compra !== undefined && valor_compra !== '') {
      const valorNum = Math.round(Number(valor_compra));
      if (Number.isNaN(valorNum) || valorNum <= 0) {
        throw new Error('El valor de compra debe ser mayor a 0.');
      }
      dataActualizada.valor_compra = valorNum;
    }

    return await prisma.equipo.update({
      where: { codigo },
      data: dataActualizada,
      include: {
        kit: true,
        jefe: true,
      },
    });
  },

  async darDeBaja(codigo, motivo) {
    if (!motivo || !motivo.trim()) {
      throw new Error('Debe indicar un motivo para dar de baja el equipo.');
    }

    const equipo = await prisma.equipo.findUnique({
      where: { codigo },
      include: {
        incidentes: true,
        revisiones: true,
      },
    });

    if (!equipo) {
      throw new Error(`El equipo con código ${codigo} no existe.`);
    }

    const idKitAnterior = equipo.id_kit;
    const sinHistorial = equipo.incidentes.length === 0 && equipo.revisiones.length === 0;

    // 1. Dar de baja el equipo y sacarlo de su kit
    const equipoActualizado = await prisma.equipo.update({
      where: { codigo },
      data: {
        estado: 'DADO_DE_BAJA',
        motivo_baja: motivo.trim(),
        fecha_baja: new Date(),
        id_kit: null,
        id_evento_repuesto: null,
      },
      include: {
        kit: true,
        jefe: true,
      },
    });

    // 2. Postcondición RF-P5-03: Si pertenecía a un kit, verificar si queda incompleto
    if (idKitAnterior) {
      const equiposRestantes = await prisma.equipo.findMany({
        where: { id_kit: idKitAnterior, estado: 'OPERATIVO' },
      });

      const categoriasPresentes = new Set(equiposRestantes.map((e) => e.categoria));
      const categoriasMinimas = ['CAMARA', 'TRIPODE', 'MICROFONO', 'SWITCH_VIDEO'];
      const cumpleMinimo = categoriasMinimas.every((cat) => categoriasPresentes.has(cat));

      if (!cumpleMinimo) {
        await prisma.kit.update({
          where: { id_kit: idKitAnterior },
          data: { estado: 'INCOMPLETO' },
        });
      }
    }

    return {
      equipo: equipoActualizado,
      sinHistorial,
      mensaje: 'Equipo dado de baja correctamente.',
    };
  },

  async eliminar(codigo) {
    const equipo = await prisma.equipo.findUnique({
      where: { codigo },
      include: {
        incidentes: true,
        revisiones: true,
      },
    });

    if (!equipo) {
      throw new Error(`El equipo con código ${codigo} no existe.`);
    }

    if (equipo.incidentes.length > 0 || equipo.revisiones.length > 0) {
      throw new Error('No se puede eliminar definitivamente porque registra historial de uso.');
    }

    const idKitAnterior = equipo.id_kit;

    const eliminado = await prisma.equipo.delete({
      where: { codigo },
    });

    // Si estaba en un kit antes de eliminarse, verificar si el kit queda INCOMPLETO
    if (idKitAnterior) {
      const equiposRestantes = await prisma.equipo.findMany({
        where: { id_kit: idKitAnterior, estado: 'OPERATIVO' },
      });

      const categoriasPresentes = new Set(equiposRestantes.map((e) => e.categoria));
      const categoriasMinimas = ['CAMARA', 'TRIPODE', 'MICROFONO', 'SWITCH_VIDEO'];
      const cumpleMinimo = categoriasMinimas.every((cat) => categoriasPresentes.has(cat));

      if (!cumpleMinimo) {
        await prisma.kit.update({
          where: { id_kit: idKitAnterior },
          data: { estado: 'INCOMPLETO' },
        });
      }
    }

    return eliminado;
  },
};