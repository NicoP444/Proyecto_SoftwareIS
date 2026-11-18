import { Router } from 'express';
import * as acuerdoController from '../controllers/acuerdo.controller.js';
import { validarId, validarCampos } from '../middlewares/validate.middleware.js';
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

// Obtener todos los acuerdos
router.get('/', acuerdoController.obtenerAcuerdos);

// Crear acuerdo
router.post(
  '/',
  crearAcuerdoSchema,
  validarCampos,
  validarRelacionesAcuerdo,
  acuerdoController.crearAcuerdo
);

// Registrar cumplimiento del aporte (RF-P4-04)
router.put(
  '/:id/cumplimiento',
  validarId,
  validarAcuerdoExiste,
  cumplimientoAcuerdoSchema,
  validarCampos,
  acuerdoController.registrarCumplimiento
);

// Declarar aporte incobrable (RF-P4-06)
router.patch(
  '/:id/incobrable',
  validarId,
  validarAcuerdoExiste,
  incobrableAcuerdoSchema,
  validarCampos,
  acuerdoController.declararIncobrable
);

// Modificar acuerdo
router.put(
  '/:id',
  validarId,
  validarAcuerdoExiste,
  modificarAcuerdoSchema,
  validarCampos,
  acuerdoController.modificarAcuerdo
);

// Eliminar acuerdo
router.delete(
  '/:id',
  validarId,
  validarAcuerdoExiste,
  acuerdoController.eliminarAcuerdo
);

export default router;