import { Router } from 'express';
import * as equipoController from '../controllers/equipo.controller.js';
import { validarCampos } from '../middlewares/validate.middleware.js';
import {
  validarEquipoExiste,
  validarEquipoNoDadoDeBaja,
  validarSinHistorialParaEliminar
} from '../middlewares/equipo.middleware.js';
import {
  validarCodigoParamSchema,
  crearEquipoSchema,
  modificarEquipoSchema,
  bajaEquipoSchema
} from '../schemas/equipo.schema.js';

const router = Router();

// Obtener todos los equipos
router.get('/', equipoController.obtenerEquipos);

// Registrar equipo (RF-P5-01)
router.post(
  '/',
  crearEquipoSchema,
  validarCampos,
  equipoController.crearEquipo
);

// Modificar equipo (RF-P5-02)
router.put(
  '/:codigo',
  validarCodigoParamSchema,
  validarCampos,
  validarEquipoExiste,
  modificarEquipoSchema,
  validarCampos,
  equipoController.modificarEquipo
);

// Dar de baja equipo (RF-P5-03)
router.patch(
  '/:codigo/baja',
  validarCodigoParamSchema,
  validarCampos,
  validarEquipoExiste,
  validarEquipoNoDadoDeBaja,
  bajaEquipoSchema,
  validarCampos,
  equipoController.darDeBajaEquipo
);

// Eliminar equipo definitivamente si no tiene historial (RF-P5-03)
router.delete(
  '/:codigo',
  validarCodigoParamSchema,
  validarCampos,
  validarEquipoExiste,
  validarSinHistorialParaEliminar,
  equipoController.eliminarEquipo
);

export default router;