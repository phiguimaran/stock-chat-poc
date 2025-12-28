import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';

import { handleMensaje } from '../routes/handlers/handleMensaje.js';
import { handleConfirmar } from '../routes/handlers/handleConfirmar.js';
import { handleAdminList } from '../routes/handlers/handleAdminList.js';
import { handleAdminAction } from '../routes/handlers/handleAdminAction.js';
import { handleCorreccion } from '../routes/handlers/handleCorreccion.js';

export const apiRouter = Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB, alineado con límites comunes
});

apiRouter.post('/mensaje', upload.single('audio'), handleMensaje);
apiRouter.post('/mensaje/confirmar', handleConfirmar);
apiRouter.post('/mensaje/correccion', handleCorreccion);

// Backoffice (mínimo)
apiRouter.get('/admin/eventos', handleAdminList);
apiRouter.post('/admin/eventos/accion', handleAdminAction);
