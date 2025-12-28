import { Event } from '../../models/Event.js';

export async function handleAdminList(req, res, next) {
  try {
    const { estado, desde, hasta, user_id, limit } = req.query;

    const q = {};
    if (estado) q.estado = estado;
    if (user_id) q.user_id = user_id;

    if (desde || hasta) {
      q.createdAt = {};
      if (desde) q.createdAt.$gte = new Date(desde);
      if (hasta) q.createdAt.$lte = new Date(hasta);
    }

    const lim = Math.min(Number(limit || 50), 200);

    const items = await Event.find(q)
      .sort({ createdAt: -1 })
      .limit(lim)
      .select({
        estado: 1, user_id: 1, session_id: 1, contexto: 1,
        tipo: 1, texto_original: 1, texto_transcripto: 1,
        validacion_ok: 1, validacion_errores: 1,
        movimientos_ejecutados: 1, movimientos_fallidos: 1,
        confirmado_at: 1, cancelado_at: 1, deshecho_at: 1,
        createdAt: 1, updatedAt: 1
      })
      .lean();

    res.json({ ok: true, items: items.map(i => ({ ...i, _id: String(i._id) })) });
  } catch (e) {
    next(e);
  }
}
