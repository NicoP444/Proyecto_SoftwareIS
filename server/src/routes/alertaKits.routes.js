import { Router } from 'express';
import { getKitsSinRetorno } from '../controllers/alertaKits.controller.js';
import { autenticar, permitirRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(autenticar, permitirRoles('JEFE_TECNICO', 'DUENO'));

router.get('/kits-sin-retorno', getKitsSinRetorno);

export default router;