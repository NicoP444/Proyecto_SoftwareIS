import { Router } from 'express';
import auspiciadorRoutes from './auspiciador.routes.js';
import incidenteRoutes from './incidente.routes.js';
import rolRoutes from './rol.routes.js';//nico
import trabajadorRoutes from './trabajador.routes.js';//nico
import desempenaRoutes from './desempena.routes.js';// nico
import acuerdoRoutes from './acuerdo.routes.js';
import disponibilidadRoutes from './disponibilidad.routes.js';//nico
import salidaKitRoutes from './salidaKit.routes.js';
import historialCambioRoutes from './historialCambio.routes.js'; // nico

const router = Router();

// Aquí le decimos al servidor que use tus rutas
router.use('/auspiciadores', auspiciadorRoutes);
router.use('/incidentes', incidenteRoutes);
router.use('/rol', rolRoutes); //nico
router.use('/trabajadores/:id/disponibilidad', disponibilidadRoutes);//nico
router.use('/trabajadores',trabajadorRoutes);//nico
router.use('/desempena', desempenaRoutes);// nico
router.use('/acuerdos', acuerdoRoutes);
router.use('/salidas-kits', salidaKitRoutes);
router.use('/historial-cambios', historialCambioRoutes)//nico


export default router;