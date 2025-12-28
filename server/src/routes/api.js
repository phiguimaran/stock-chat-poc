import express from 'express';
import multer from 'multer';

import { handleMensaje } from './handlers/handleMensaje.js';
import { handleMensajeVoz } from './handlers/handleMensajeVoz.js';
import { handleConfirmar } from './handlers/handleConfirmar.js';
import { handleCorreccion } from './handlers/handleCorreccion.js';
import { handleAdminList } from './handlers/handleAdminList.js';
import { handleAdminAction } from './handlers/handleAdminAction.js';

const router = express.Router();

// multer en memoria (audio chico, PoC)
const upload = multer({ storage: multer.memoryStorage() });

// ---- MENSAJES ----
router.post('/mensaje', handleMensaje);
router.post('/mensaje/voz', upload.single('audio'), handleMensajeVoz);

// ---- CONFIRMACIONES ----
router.post('/mensaje/confirmar', handleConfirmar);
router.post('/mensaje/corregir', handleCorreccion);

// ---- ADMIN ----
router.get('/admin/eventos', handleAdminList);
router.post('/admin/eventos/:id/accion', handleAdminAction);

export default router;

