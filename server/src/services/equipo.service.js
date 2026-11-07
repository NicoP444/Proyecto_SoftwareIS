import prisma from '../config/prisma.js';

export const equipoService = {
  // 1. Obtener todos los equipos registrados en inventario
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

  // 2. Registrar equipo generando código único por unidad (RF-P5-01)
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

    // Validación básica
    if (!nombre || !categoria || !fecha_compra || valor_compra === undefined) {
      throw new Error('Faltan campos obligatorios: nombre, categoría, fecha de compra o valor.');
    }

    // Resolver ID de Jefe de Área Técnica si no viene provisto
    let jefeId = Number(id_jefe);
    if (!jefeId) {
      let jefeExistente = await prisma.jefeAreaTecnica.findFirst();
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

    // Prefijo de 3 letras según categoría para el código único
    const prefijos = {
      CAMARA: 'CAM',
      TRIPODE: 'TRI',
      MICROFONO: 'MIC',
      SWITCH_VIDEO: 'SWV',
      OTRO: 'EQP',
    };
    const prefijo = prefijos[categoria] || 'EQP';

    // Generar código único correlativo (ej: CAM-001, CAM-002, etc.)
    const totalExistentes = await prisma.equipo.count({
      where: { categoria },
    });
    const correlativo = String(totalExistentes + 1).padStart(3, '0');
    let codigoGenerado = `${prefijo}-${correlativo}`;

    // Asegurar unicidad en caso de saltos de ID o eliminaciones previas
    let intento = 1;
    while (await prisma.equipo.findUnique({ where: { codigo: codigoGenerado } })) {
      codigoGenerado = `${prefijo}-${String(totalExistentes + intento + 1).padStart(3, '0')}`;
      intento++;
    }

    // Crear registro: estado OPERATIVO por defecto, id_kit null (repuesto disponible)
    return await prisma.equipo.create({
      data: {
        codigo: codigoGenerado,
        nombre: nombre.trim(),
        categoria,
        marca: marca ? marca.trim() : null,
        modelo: modelo ? modelo.trim() : null,
        fecha_compra: new Date(fecha_compra),
        valor_compra: Number(valor_compra),
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
};