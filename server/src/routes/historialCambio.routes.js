import {Router} from 'express';
import { getHistorialCambios, postHistorialCambio } from '../controllers/historialCambio.controller.js';
import { verListadoHistorialCambioMiddleware,crearHistorialCambioMiddleware,} from '../middlewares/historialCambio.middleware.js';


const router = Router();

router.get('/', verListadoHistorialCambioMiddleware, getHistorialCambios);
router.post('/', crearHistorialCambioMiddleware, postHistorialCambio);

export default router;

//para get y post
//http://localhost:3000/api/historial-cambios?id_dueno=1 
