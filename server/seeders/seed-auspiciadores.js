// Auspiciadores de prueba. Solo crea los auspiciadores: los acuerdos con los eventos se crean a mano desde la app.
// Hay que correr antes: seed:base (necesita un dueño).
//   Crear:  npm run seed:auspiciadores
//   Borrar: npm run seed:limpiar
// Se puede correr varias veces: si el auspiciador ya existe, no lo duplica.
import 'dotenv/config';
import prisma from '../src/config/prisma.js';

// clasificacion: CONFIABLE (por defecto) o NO_CONFIABLE (con motivo)
const AUSPICIADORES = [
  // --- Marcas grandes (confiables) ---
  { nombre: 'Coca-Cola', rubro: 'Bebidas', contacto: 'Andrea Fuentes', telefono: '+56911000001' },
  { nombre: 'Pepsi', rubro: 'Bebidas', contacto: 'Camila Vergara', telefono: '+56911000005' },
  { nombre: 'Gatorade', rubro: 'Bebidas deportivas', contacto: 'Matías Rojas', telefono: '+56911000002' },
  { nombre: 'Powerade', rubro: 'Bebidas deportivas', contacto: 'Daniela Pino', telefono: '+56911000003' },
  { nombre: 'Red Bull', rubro: 'Bebidas energéticas', contacto: 'Nicolás Soto', telefono: '+56911000006' },
  { nombre: 'Monster Energy', rubro: 'Bebidas energéticas', contacto: 'Javiera Contreras', telefono: '+56911000007' },
  { nombre: 'Adidas', rubro: 'Ropa deportiva', contacto: 'Sebastián Muñoz', telefono: '+56911000008' },
  { nombre: 'Nike', rubro: 'Ropa deportiva', contacto: 'Valentina Gaete', telefono: '+56911000009' },
  { nombre: 'Netflix', rubro: 'Streaming', contacto: 'Felipe Araya', telefono: '+56911000004' },
  { nombre: 'Spotify', rubro: 'Streaming de música', contacto: 'Francisca Lagos', telefono: '+56911000010' },
  { nombre: 'Entel', rubro: 'Telecomunicaciones', contacto: 'Rodrigo Parra', telefono: '+56911000011' },
  { nombre: 'BancoEstado', rubro: 'Banca', contacto: 'Paula Henríquez', telefono: '+56911000012' },

  // --- Marcas pequeñas o locales (confiables) ---
  { nombre: 'Panadería La Espiga', rubro: 'Panadería', contacto: 'Don Hernán Vidal', telefono: '+56911000013' },
  { nombre: 'Ferretería El Tornillo', rubro: 'Ferretería', contacto: 'Marcela Ibarra', telefono: '+56911000014' },
  { nombre: 'Gimnasio Fuerza Sur', rubro: 'Gimnasio', contacto: 'Cristóbal Mella', telefono: '+56911000015' },

  // --- Marcas pequeñas o raras (no confiables) ---
  {
    nombre: 'Energética Rayo Azul', rubro: 'Bebidas energéticas', contacto: 'Jonathan Cárdenas', telefono: '+56911000016',
    clasificacion: 'NO_CONFIABLE',
    motivo_clasificacion: 'Incumplió el pago comprometido en 2 eventos anteriores y no respondió los llamados.',
  },
  {
    nombre: 'Cripto Fácil Chile', rubro: 'Criptomonedas', contacto: 'Ignacio Bravo', telefono: '+56911000017',
    clasificacion: 'NO_CONFIABLE',
    motivo_clasificacion: 'Ofreció aportes muy altos sin contrato y desapareció antes del evento.',
  },
  {
    nombre: 'Zapatillas Veloz', rubro: 'Calzado deportivo', contacto: 'Karen Olivares', telefono: '+56911000018',
    clasificacion: 'NO_CONFIABLE',
    motivo_clasificacion: 'Entregó el canje con 3 semanas de atraso y con menos productos de los acordados.',
  },
  {
    nombre: 'Súper Jugos Tío Pepe', rubro: 'Jugos naturales', contacto: 'José Pérez', telefono: '+56911000019',
    clasificacion: 'NO_CONFIABLE',
    motivo_clasificacion: 'Paga solo una parte del monto y pide rebajas después del evento.',
  },
  {
    nombre: 'Apuestas Gol Seguro', rubro: 'Apuestas deportivas', contacto: 'Matías Quiroz', telefono: '+56911000020',
    clasificacion: 'NO_CONFIABLE',
    motivo_clasificacion: 'Negocio sin permisos claros; el aporte quedó sin pagar y se canceló el acuerdo.',
  },
];

async function main() {
  const dueno = await prisma.dueno.findFirst();
  if (!dueno) throw new Error('No existe ningún dueño. Ejecuta primero: npm run seed:base');

  let creados = 0;
  for (const a of AUSPICIADORES) {
    const existe = await prisma.auspiciador.findFirst({ where: { nombre: a.nombre, id_dueno: dueno.id_dueno } });
    if (existe) continue;
    await prisma.auspiciador.create({
      data: { clasificacion: 'CONFIABLE', ...a, id_dueno: dueno.id_dueno },
    });
    creados++;
    console.log(`Auspiciador creado: ${a.nombre}${a.clasificacion === 'NO_CONFIABLE' ? ' (NO CONFIABLE)' : ''}`);
  }
  console.log(`Listo: ${creados} auspiciador(es) nuevos (${AUSPICIADORES.length - creados} ya existían)`);
}

main()
  .catch((e) => { console.error('Error en seed de auspiciadores:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());