import { Router } from 'express';
import { auspiciadorController } from '../controllers/auspiciador.controller.js';
import { auspiciadorSchema } from '../schemas/auspiciador.schema.js';
import { validarCampos, validarId } from '../middlewares/validate.middleware.js'; 

const router = Router();

router.get('/', auspiciadorController.obtenerTodos);

// Al crear: validamos con el schema y procesamos con validarCampos
router.post('/', auspiciadorSchema, validarCampos, auspiciadorController.crear);

// Al modificar: validamos que el ID sea correcto, el schema y los errores
router.put('/:id', validarId, auspiciadorSchema, validarCampos, auspiciadorController.modificar);

// Al eliminar: validamos que el ID sea correcto antes de pasar al controlador
router.delete('/:id', validarId, auspiciadorController.eliminar);

export default router;