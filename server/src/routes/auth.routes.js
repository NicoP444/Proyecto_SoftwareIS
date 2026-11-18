import { Router } from 'express';
import { login, logout } from '../controllers/auth.controller.js';

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout (cierra la sesión en la BD)
router.post('/logout', logout);

export default router;