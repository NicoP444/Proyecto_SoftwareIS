import { Router } from 'express';
import auspiciadorRoutes from './auspiciador.routes.js';
import incidenteRoutes from './incidente.routes.js';
import rolRoutes from './rol.routes.js';//nico
import trabajadorRoutes from './trabajador.routes.js';//nico
import desempenaRoutes from './desempena.routes.js';// nico
import acuerdoRoutes from './acuerdo.routes.js';
import disponibilidadRoutes from './disponibilidad.routes.js';//nico
import salidaKitRoutes from './salidaKit.routes.js';
import retornoKitRoutes from './retornoKit.routes.js';
import historialCambioRoutes from './historialCambio.routes.js'; // nico
import historialEquipoRoutes from './historialEquipo.routes.js';
import alertaKitsRoutes from './alertaKits.routes.js';
import equipoRoutes from './equipo.routes.js';

import gastosEventosRoutes from './gastosEvento.routes.js'; // nico
import eventoRoutes from './evento.routes.js';
import rendicionRoutes from './rendicion.routes.js';// nico
import remuneracionRoutes from './remumeracion.routes.js'; // nico
import marcarEventoRoutes from './marcarEvento.routes.js';
import inventarioRoutes from './consultarInventario.routes.js';
import cierreRoutes from './cierre.routes.js'; // nico
import rentabilidadRoutes from './rentabilidad.routes.js'; // nico
import pagoRemuneracionRoutes from './pagoRemuneracion.routes.js'// nico
const router = Router();

// Aquí le decimos al servidor que use tus rutas
router.use('/auspiciadores', auspiciadorRoutes);
router.use('/incidentes', incidenteRoutes);
router.use('/rol', rolRoutes); //nico
router.use('/trabajadores/:id/disponibilidad', disponibilidadRoutes);//nico
router.use('/trabajadores',trabajadorRoutes);//nico
router.use('/gastosEvento', gastosEventosRoutes); // nico
router.use('/acuerdos', acuerdoRoutes);
router.use('/salidas-kits', salidaKitRoutes);
router.use('/retornos-kits', retornoKitRoutes);
router.use('/historial-cambios', historialCambioRoutes)//nico
router.use('/equipos-historial', historialEquipoRoutes);
router.use('/alertas', alertaKitsRoutes);
router.use('/rentabilidad', rentabilidadRoutes);//nico
router.use('/pagos-remuneracion', pagoRemuneracionRoutes);// nico
router.use('/', desempenaRoutes);// nico
router.use('/eventos', eventoRoutes);
router.use('/rendiciones', rendicionRoutes);// nico
router.use('/remuneraciones', remuneracionRoutes);// nico
router.use('/equipos', equipoRoutes);
router.use('/eventos-realizados', marcarEventoRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/cierre-jornada', cierreRoutes);//nico

export default router;