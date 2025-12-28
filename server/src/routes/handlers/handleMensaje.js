import { processMensaje } from './processMensaje.js';

export async function handleMensaje(req, res) {
  try {
    const { contenido, contexto, session_id, user_id } = req.body;

    if (!contenido) {
      return res.status(400).json({
        ok: false,
        error: 'contenido requerido'
      });
    }

    const result = await processMensaje({
      texto: contenido,
      contexto,
      session_id,
      user_id,
      origen: 'texto'
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

