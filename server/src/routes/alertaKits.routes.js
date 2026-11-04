import { Router } from 'express';
import { getKitsSinRetorno } from '../controllers/alertaKits.controller.js';

const router = Router();

router.get('/kits-sin-retorno', getKitsSinRetorno);

export default router;