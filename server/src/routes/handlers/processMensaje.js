import { Event } from '../../models/Event.js';
import { parseNaturalLanguage } from '../../services/parseMessage.js';
import { validateActions } from '../../services/validateActions.js';

export async function processMensaje({
  texto,
  contexto,
  session_id,
  user_id,
  origen = 'texto'
}) {
  // 1. Parseo lenguaje natural
  const { parsed, raw, model } = await parseNaturalLanguage({
    texto,
    contexto
  });

  // 2. Validación contra BD
  const validacion = await validateActions(parsed.acciones);

  // 3. Crear evento (misma lógica que antes)
  const ev = await Event.create({
    tipo: origen,
    texto_original: texto,
    contexto,
    session_id,
    user_id,
    estado: 'pendiente_confirmacion',
    validacion_ok: validacion.ok,
    validacion_errores: validacion.errores,
    interpretaciones: [{
      modelo: model,
      texto_usado: texto,
      acciones: parsed.acciones,
      confianza: parsed.confianza ?? null,
      raw
    }]
  });

  return {
    ok: true,
    evento_id: String(ev._id),
    estado: ev.estado,
    texto_interpretado: texto,
    interpretacion: ev.interpretaciones.at(-1),
    validacion: {
      ok: ev.validacion_ok,
      errores: ev.validacion_errores
    },
    requiere_confirmacion: ev.estado === 'pendiente_confirmacion'
  };
}

