import prisma from '../config/prisma.js';

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
    const fechaObj = new Date(fecha_compra);

    // 5. Inserción
    return await prisma.equipo.create({
      data: {
        codigo: codigoGenerado,
        nombre: nombre.trim(),
        categoria,
        marca: marca ? marca.trim() : null,
        modelo: modelo ? modelo.trim() : null,
        fecha_compra: fechaObj,
        valor_compra: Math.round(Number(valor_compra)),
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
      categoria,
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
    if (categoria !== undefined) {
      dataActualizada.categoria = categoria;
    }
    if (marca !== undefined) {
      dataActualizada.marca = marca ? marca.trim() : null;
    }
    if (modelo !== undefined) {
      dataActualizada.modelo = modelo ? modelo.trim() : null;
    }
    if (fecha_compra) {
      dataActualizada.fecha_compra = new Date(fecha_compra);
    }
    if (valor_compra !== undefined && valor_compra !== '') {
      dataActualizada.valor_compra = Math.round(Number(valor_compra));
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
};