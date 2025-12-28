import { Event } from '../../models/Event.js';
import { transcribeAudio } from '../../services/transcribe.js';
import { parseNaturalLanguage } from '../../services/parseMessage.js';
import { validateActions } from '../../services/validateActions.js';

export async function handleMensaje(req, res, next) {
  try {
    const { tipo, contenido, contexto, session_id, user_id } = req.body || {};
    const hasFile = Boolean(req.file);

    const finalTipo = hasFile ? 'audio' : 'texto';
    const textoOriginal = finalTipo === 'texto' ? (contenido || '').toString() : null;

    const ev = await Event.create({
      tipo: finalTipo,
      texto_original: textoOriginal,
      audio_path: hasFile ? req.file.path : null,
      contexto: (contexto || 'stock_movimientos').toString(),
      session_id: session_id || null,
      user_id: user_id || 'anon',
      estado: 'recibido'
    });

    // Texto base
    let textoUsado = textoOriginal;
    if (finalTipo === 'audio') {
      const t = await transcribeAudio({ filePath: req.file.path });
      await Event.updateOne({ _id: ev._id }, { $set: { texto_transcripto: t } });
      textoUsado = t;
    }

    // Parse
    const parsed = await parseNaturalLanguage({ texto: textoUsado, contexto: ev.contexto });

    // Validación y normalización (modifica acciones en memoria)
    const acciones = parsed.parsed.acciones.map(a => ({ ...a }));
    const errores = await validateActions(acciones);

    const estado = errores.length ? 'requiere_aclaracion' : 'pendiente_confirmacion';

    await Event.updateOne(
      { _id: ev._id },
      {
        $set: {
          estado,
          validacion_ok: errores.length === 0,
          validacion_errores: errores
        },
        $push: {
          interpretaciones: {
            modelo: parsed.model,
            texto_usado: textoUsado,
            acciones,
            confianza: parsed.parsed.confianza ?? null,
            raw: parsed.raw
          }
        }
      }
    );

    const updated = await Event.findById(ev._id).lean();

    res.json({
      ok: true,
      evento_id: String(updated._id),
      estado: updated.estado,
      texto_interpretado: textoUsado,
      interpretacion: updated.interpretaciones.at(-1),
      validacion: { ok: updated.validacion_ok, errores: updated.validacion_errores },
      requiere_confirmacion: updated.estado === 'pendiente_confirmacion'
    });
  } catch (e) {
    next(e);
  }
}
