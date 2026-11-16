import { Router } from 'express';
import { getPanel } from '../controllers/panel.controller.js';

const router = Router();

// RF-T-07: datos del panel de inicio según el rol
router.get('/:rol', getPanel);

export default router;