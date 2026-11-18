import { Router } from 'express';
import * as acuerdoController from '../controllers/acuerdo.controller.js';
import { validarId, validarCampos } from '../middlewares/validate.middleware.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';
import {
  validarAcuerdoExiste,
  validarRelacionesAcuerdo
} from '../middlewares/acuerdo.middleware.js';
import {
  crearAcuerdoSchema,
  modificarAcuerdoSchema,
  cumplimientoAcuerdoSchema,
  incobrableAcuerdoSchema
} from '../schemas/acuerdo.schema.js';

const router = Router();

// Todas las rutas exigen sesión iniciada
router.use(autenticar);

// Ver acuerdos: Dueño y Contador 
router.get('/', permitirRoles('DUENO', 'CONTADOR'), acuerdoController.obtenerAcuerdos);

// Registrar acuerdo: Dueño (RF-P4-02)
router.post(
  '/',
  permitirRoles('DUENO'),
  crearAcuerdoSchema,
  validarCampos,
  validarRelacionesAcuerdo,
  acuerdoController.crearAcuerdo
);

// Registrar cumplimiento del aporte: Contador 
router.put(
  '/:id/cumplimiento',
  permitirRoles('CONTADOR'),
  validarId,
  validarAcuerdoExiste,
  cumplimientoAcuerdoSchema,
  validarCampos,
  acuerdoController.registrarCumplimiento
);

// Declarar aporte incobrable: Dueño 
router.patch(
  '/:id/incobrable',
  permitirRoles('DUENO'),
  validarId,
  validarAcuerdoExiste,
  incobrableAcuerdoSchema,
  validarCampos,
  acuerdoController.declararIncobrable
);

// Modificar acuerdo: Dueño
router.put(
  '/:id',
  permitirRoles('DUENO'),
  validarId,
  validarAcuerdoExiste,
  modificarAcuerdoSchema,
  validarCampos,
  acuerdoController.modificarAcuerdo
);

// Eliminar acuerdo: Dueño
router.delete(
  '/:id',
  permitirRoles('DUENO'),
  validarId,
  validarAcuerdoExiste,
  acuerdoController.eliminarAcuerdo
);

export default router;