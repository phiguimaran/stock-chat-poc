import express from 'express';
import multer from 'multer';

import { handleMensaje } from './handlers/handleMensaje.js';
import { handleMensajeVoz } from './handlers/handleMensajeVoz.js';
import { handleConfirmar } from './handlers/handleConfirmar.js';
import { handleCorreccion } from './handlers/handleCorreccion.js';
import { handleAdminList } from './handlers/handleAdminList.js';
import { handleAdminAction } from './handlers/handleAdminAction.js';

const router = express.Router();

// ============================
// MULTER (audio en memoria)
// ============================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB, suficiente para PoC
  }
});

// ============================
// MENSAJES
// ============================

// Texto → JSON
router.post(
  '/mensaje',
  express.json(),
  handleMensaje
);

// Voz → multipart/form-data (SIN express.json)
router.post(
  '/mensaje/voz',
  upload.single('audio'),
  handleMensajeVoz
);

// ============================
// CONFIRMACIONES
// ============================

router.post(
  '/mensaje/confirmar',
  express.json(),
  handleConfirmar
);

router.post(
  '/mensaje/corregir',
  express.json(),
  handleCorreccion
);

// ============================
// ADMIN
// ============================

router.get(
  '/admin/eventos',
  handleAdminList
);

router.post(
  '/admin/eventos/:id/accion',
  express.json(),
  handleAdminAction
);

export default router;

