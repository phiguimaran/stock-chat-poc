import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { processMensaje } from './processMensaje.js';

const execFileAsync = promisify(execFile);

export async function handleMensajeVoz(req, res, next) {
  try {
    if (!req.file || !req.file.buffer) {
      throw Object.assign(new Error('audio requerido'), { statusCode: 400 });
    }

    const { contexto, session_id = 'demo', user_id = 'demo' } = req.body;

    // 1️⃣ Guardar audio temporal
    const tmpDir = path.resolve('tmp');
    fs.mkdirSync(tmpDir, { recursive: true });

    const audioPath = path.join(
      tmpDir,
      `audio_${Date.now()}.webm`
    );

    fs.writeFileSync(audioPath, req.file.buffer);

    // 2️⃣ Ejecutar STT local
    const pythonBin = path.resolve('stt/venv/bin/python');
    const sttScript = path.resolve('stt/stt_local.py');

    const { stdout } = await execFileAsync(
      pythonBin,
      [sttScript, audioPath],
      { timeout: 120_000 }
    );

    // 3️⃣ Parsear salida
    let result;
    try {
      result = JSON.parse(stdout);
    } catch {
      throw new Error('STT devolvió salida inválida');
    }

    if (!result.ok || !result.text) {
      throw Object.assign(
        new Error('No se pudo transcribir el audio'),
        { statusCode: 422 }
      );
    }

    // 4️⃣ Continuar flujo normal
    const response = await processMensaje({
      texto: result.text,
      contexto,
      session_id,
      user_id,
      origen: 'voz'
    });

    res.json(response);

    // 5️⃣ Limpieza
    fs.unlink(audioPath, () => {});

  } catch (err) {
    next(err);
  }
}

