import { processMensaje } from './processMensaje.js';
import { transcribeAudio } from '../../services/transcribe.js';

export async function handleMensajeVoz(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: 'audio requerido'
      });
    }

    const { contexto, session_id, user_id } = req.body;

    // 1. Transcripción
    const texto = await transcribeAudio(req.file);

    if (!texto || !texto.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'no se pudo transcribir audio'
      });
    }

    // 2. Mismo core que texto
    const result = await processMensaje({
      texto,
      contexto,
      session_id,
      user_id,
      origen: 'voz'
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}

